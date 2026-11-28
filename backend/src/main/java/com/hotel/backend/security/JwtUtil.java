package com.hotel.backend.security;

import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.Room;
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

    /**
     * Generates a passwordless HttpOnly session JWT strictly bound to an active hotel room stay.
     * Subject is the verified normalized email or phone digits; stayRef invalidates on checkout or room move.
     */
    public String generateGuestToken(Hotel hotel, Room room, String normalizedIdentifier) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tokenType", "GUEST_PORTAL");
        claims.put("role", Role.GUEST.name());
        claims.put("hotelId", hotel.getId());
        claims.put("hotelSlug", hotel.getSlug());
        claims.put("roomNumber", room.getRoomNumber());
        claims.put("stayRef", room.getBookingRef() != null ? room.getBookingRef() : "");
        claims.put("guestName", room.getGuestName() != null ? room.getGuestName() : "Guest");

        Date now = new Date();
        // Guest stay token capped at max(expirationMs, 7 days) since live checkout/room-move revokes immediately
        long guestValidityMs = Math.max(expirationMs, 7L * 24 * 60 * 60 * 1000);
        Date expiryDate = new Date(now.getTime() + guestValidityMs);

        return Jwts.builder()
                .subject(normalizedIdentifier)
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public boolean isGuestToken(Claims claims) {
        return claims != null && "GUEST_PORTAL".equals(claims.get("tokenType", String.class));
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
