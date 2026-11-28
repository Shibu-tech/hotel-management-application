package com.hotel.backend.controller;

import com.hotel.backend.dto.GuestLoginRequest;
import com.hotel.backend.dto.GuestSessionResponse;
import com.hotel.backend.service.GuestAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/guest-auth")
public class GuestAuthController {

    public static final String GUEST_COOKIE_NAME = "hotel_guest_token";

    private final GuestAuthService guestAuthService;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public GuestAuthController(
            GuestAuthService guestAuthService,
            @Value("${app.cookie.secure:false}") boolean cookieSecure,
            @Value("${app.cookie.same-site:Lax}") String cookieSameSite) {
        this.guestAuthService = guestAuthService;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/login")
    public ResponseEntity<GuestSessionResponse> loginGuest(
            @Valid @RequestBody GuestLoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse,
            CsrfToken csrfToken) {
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        String clientIp = resolveClientIp(httpRequest);
        GuestAuthService.GuestLoginResult result = guestAuthService.loginWithIdentifier(request, clientIp);
        setGuestCookie(httpResponse, result.token());
        return ResponseEntity.ok(result.session());
    }

    @GetMapping("/session")
    public ResponseEntity<GuestSessionResponse> getSession(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse,
            CsrfToken csrfToken) {
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        String token = extractGuestCookie(httpRequest);
        try {
            GuestSessionResponse session = guestAuthService.verifyGuestSession(token);
            return ResponseEntity.ok(session);
        } catch (RuntimeException ex) {
            clearGuestCookie(httpResponse);
            throw ex;
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> checkoutGuest(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String token = extractGuestCookie(httpRequest);
        try {
            guestAuthService.checkoutCurrentGuestSession(token);
        } finally {
            clearGuestCookie(httpResponse);
        }
        return ResponseEntity.ok(Map.of("message", "Checked out successfully. Room portal access ended."));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logoutGuest(HttpServletResponse httpResponse) {
        clearGuestCookie(httpResponse);
        return ResponseEntity.ok(Map.of("message", "Guest logged out."));
    }

    private String extractGuestCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (GUEST_COOKIE_NAME.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                    return c.getValue();
                }
            }
        }
        return null;
    }

    private void setGuestCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(GUEST_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(cookieSameSite)
                .maxAge(Duration.ofDays(7))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearGuestCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(GUEST_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(cookieSameSite)
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
