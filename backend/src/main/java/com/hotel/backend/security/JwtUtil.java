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
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be configured via environment variable and be at least 32 UTF-8 bytes long.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        claims.put("tokenVersion", user.getTokenVersion());
        claims.put("mustChangePassword", user.isMustChangePassword());

        String hotelSlug = null;
        if (user.getHotel() != null) {
            hotelSlug = user.getHotel().getSlug();
            claims.put("hotelId", user.getHotel().getId());
            claims.put("hotelSlug", hotelSlug);
        }
        if (user.getDepartment() != null) {
            claims.put("departmentId", user.getDepartment().getId());
        }

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

    public Long extractTokenVersion(Claims claims) {
        Object tv = claims.get("tokenVersion");
        if (tv instanceof Number n) {
            return n.longValue();
        }
        return null;
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    /**
     * Compute authoritative redirect URL from DB-resolved Role and tenant hotelSlug.
     */
    public static String computeRedirectUrl(Role role, String hotelSlug) {
        if (role == null) {
            return "/login";
        }
        if (role == Role.ADMIN) {
            return "/admin/dashboard";
        }
        if (hotelSlug == null || hotelSlug.isBlank()) {
            return "/login";
        }
        return switch (role) {
            case GENERAL_MANAGER -> "/hotel/" + hotelSlug + "/gm";
            case SUPERVISOR -> "/hotel/" + hotelSlug + "/supervisor";
            case FRONT_DESK -> "/hotel/" + hotelSlug + "/front-desk";
            case FULFILLER -> "/hotel/" + hotelSlug + "/fulfiller";
            case GUEST -> "/hotel/" + hotelSlug + "/guest";
            case ADMIN -> "/admin/dashboard";
        };
    }
}
