package com.hotel.backend.security;

import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        claims.put("fullName", user.getFullName());

        String hotelSlug = null;
        if (user.getHotel() != null) {
            hotelSlug = user.getHotel().getSlug();
            claims.put("hotelId", user.getHotel().getId());
            claims.put("hotelSlug", hotelSlug);
            claims.put("hotelName", user.getHotel().getName());
        }

        claims.put("redirectUrl", computeRedirectUrl(user.getRole(), hotelSlug));

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public String extractHotelSlug(String token) {
        return extractAllClaims(token).get("hotelSlug", String.class);
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Requirement 3:
     * Compute exact redirectUrl based on user Role and tenant hotelSlug:
     * - ADMIN -> /admin/dashboard
     * - GENERAL_MANAGER -> /hotel/[slug]/gm
     * - SUPERVISOR -> /hotel/[slug]/supervisor
     * - FRONT_DESK -> /hotel/[slug]/front-desk
     * - FULFILLER -> /hotel/[slug]/fulfiller
     * - GUEST -> /hotel/[slug]/guest
     */
    public static String computeRedirectUrl(Role role, String hotelSlug) {
        if (role == null) {
            return "/login";
        }
        String safeSlug = (hotelSlug != null && !hotelSlug.isBlank()) ? hotelSlug : "grand-adp";
        return switch (role) {
            case ADMIN -> "/admin/dashboard";
            case GENERAL_MANAGER -> "/hotel/" + safeSlug + "/gm";
            case SUPERVISOR -> "/hotel/" + safeSlug + "/supervisor";
            case FRONT_DESK -> "/hotel/" + safeSlug + "/front-desk";
            case FULFILLER -> "/hotel/" + safeSlug + "/fulfiller";
            case GUEST -> "/hotel/" + safeSlug + "/guest";
        };
    }
}
