package com.hotel.backend.security;

import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Validates JWT from HttpOnly auth cookie (preferred) or Authorization Bearer header,
 * verifies live user/hotel status and tokenVersion against PostgreSQL, and populates
 * SecurityContext with an AuthenticatedUserPrincipal.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String cookieName;

    public JwtAuthenticationFilter(
            JwtUtil jwtUtil,
            UserRepository userRepository,
            @Value("${app.cookie.name:hotel_auth_token}") String cookieName) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.cookieName = cookieName;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String jwt = resolveToken(request);

        if (StringUtils.hasText(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = jwtUtil.extractAllClaims(jwt);
                String email = claims.getSubject();
                Long tokenVersion = jwtUtil.extractTokenVersion(claims);

                if (StringUtils.hasText(email) && tokenVersion != null) {
                    Optional<User> userOpt = userRepository.findByEmailIgnoreCaseWithTenant(email);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        boolean validUser = user.isActive()
                                && user.getTokenVersion() == tokenVersion
                                && user.getRole() != Role.GUEST;
                        boolean validHotel = user.getRole() == Role.ADMIN
                                || (user.getHotel() != null && user.getHotel().isActive());

                        if (validUser && validHotel) {
                            AuthenticatedUserPrincipal principal = AuthenticatedUserPrincipal.fromUser(user);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                }
            } catch (JwtException | IllegalArgumentException ignored) {
                // Invalid or expired token: leave SecurityContext unauthenticated
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        // 1. Prefer HttpOnly auth cookie
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (cookieName.equals(c.getName()) && StringUtils.hasText(c.getValue())) {
                    return c.getValue();
                }
            }
        }
        // 2. Fallback to Authorization Bearer header for programmatic API clients
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
