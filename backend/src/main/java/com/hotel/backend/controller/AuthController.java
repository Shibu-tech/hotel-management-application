package com.hotel.backend.controller;

import com.hotel.backend.dto.AuthResponse;
import com.hotel.backend.dto.ChangePasswordRequest;
import com.hotel.backend.dto.ForgotPasswordRequest;
import com.hotel.backend.dto.LoginRequest;
import com.hotel.backend.security.AuthenticatedUserPrincipal;
import com.hotel.backend.security.JwtUtil;
import com.hotel.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final String cookieName;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthController(
            AuthService authService,
            JwtUtil jwtUtil,
            @Value("${app.cookie.name:hotel_auth_token}") String cookieName,
            @Value("${app.cookie.secure:false}") boolean cookieSecure,
            @Value("${app.cookie.same-site:Lax}") String cookieSameSite) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.cookieName = cookieName;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse,
            CsrfToken csrfToken) {
        // Trigger CSRF cookie emission so browser receives XSRF-TOKEN immediately upon login
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        String clientIp = resolveClientIp(httpRequest);
        AuthService.LoginResult result = authService.login(request, clientIp);
        setAuthCookie(httpResponse, result.token());
        return ResponseEntity.ok(result.response());
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            CsrfToken csrfToken) {
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        AuthResponse response = authService.getCurrentUser(principal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            HttpServletResponse httpResponse) {
        authService.logout(principal);
        clearAuthCookie(httpResponse);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changePassword(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletResponse httpResponse,
            CsrfToken csrfToken) {
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        AuthService.LoginResult result = authService.changePassword(principal, request);
        setAuthCookie(httpResponse, result.token());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(Map.of(
                "message",
                "If an active employee account matches that email, please contact your hotel General Manager (or Platform Admin for GM accounts) to issue a temporary password reset."
        ));
    }

    private void setAuthCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(cookieSameSite)
                .maxAge(Duration.ofMillis(jwtUtil.getExpirationMs()))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearAuthCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
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
