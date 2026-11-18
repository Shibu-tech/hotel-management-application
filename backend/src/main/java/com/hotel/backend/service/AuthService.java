package com.hotel.backend.service;

import com.hotel.backend.dto.AuthResponse;
import com.hotel.backend.dto.ChangePasswordRequest;
import com.hotel.backend.dto.ForgotPasswordRequest;
import com.hotel.backend.dto.LoginRequest;
import com.hotel.backend.exception.AccountLockedException;
import com.hotel.backend.exception.TooManyRequestsException;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.UserRepository;
import com.hotel.backend.security.AuthenticatedUserPrincipal;
import com.hotel.backend.security.JwtUtil;
import com.hotel.backend.security.LoginRateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    public record LoginResult(AuthResponse response, String token) {}

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoginRateLimiter rateLimiter;
    private final int maxFailedAttempts;
    private final long lockoutMinutes;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            LoginRateLimiter rateLimiter,
            @Value("${app.auth.max-failed-attempts:5}") int maxFailedAttempts,
            @Value("${app.auth.lockout-minutes:15}") long lockoutMinutes) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.rateLimiter = rateLimiter;
        this.maxFailedAttempts = Math.max(1, maxFailedAttempts);
        this.lockoutMinutes = Math.max(1, lockoutMinutes);
    }

    @Transactional(noRollbackFor = {BadCredentialsException.class, AccountLockedException.class, AccessDeniedException.class})
    public LoginResult login(LoginRequest request, String clientIp) {
        String email = request.getEmail().trim().toLowerCase();
        String ipKey = "ip:" + (clientIp != null ? clientIp : "unknown");
        String emailKey = "email:" + email;

        if (!rateLimiter.isAllowed(ipKey) || !rateLimiter.isAllowed(emailKey)) {
            throw new TooManyRequestsException("Too many login attempts. Please wait before trying again.");
        }

        User user = userRepository.findByEmailIgnoreCaseWithTenant(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        LocalDateTime now = LocalDateTime.now();
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            throw new AccountLockedException("Account temporarily locked due to repeated failed login attempts. Please try again later.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= maxFailedAttempts) {
                user.setLockedUntil(now.plusMinutes(lockoutMinutes));
            }
            userRepository.save(user);
            throw new BadCredentialsException("Invalid email or password.");
        }

        // Guests must use the dedicated Guest Portal flow, never the employee login endpoint
        if (user.getRole() == Role.GUEST) {
            throw new AccessDeniedException("Guest accounts must enter through the hotel Guest Portal.");
        }

        if (!user.isActive()) {
            throw new AccessDeniedException("Account is disabled. Please contact your manager or administrator.");
        }

        // Verify assigned hotel existence and active status strictly from DB records
        if (user.getRole() != Role.ADMIN) {
            if (user.getHotel() == null) {
                throw new AccessDeniedException("Account is not linked to an active hotel property.");
            }
            if (!user.getHotel().isActive()) {
                throw new AccessDeniedException("Your hotel property is currently suspended. Access is blocked.");
            }
        }

        // Successful authentication: reset lockout counters
        if (user.getFailedLoginAttempts() > 0 || user.getLockedUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user);
        return new LoginResult(toAuthResponse(user), token);
    }

    @Transactional(readOnly = true)
    public AuthResponse getCurrentUser(AuthenticatedUserPrincipal principal) {
        User user = userRepository.findByIdWithTenant(principal.getUserId())
                .orElseThrow(() -> new BadCredentialsException("Authenticated user not found."));
        return toAuthResponse(user);
    }

    @Transactional
    public void logout(AuthenticatedUserPrincipal principal) {
        if (principal == null) {
            return;
        }
        userRepository.findById(principal.getUserId()).ifPresent(user -> {
            user.incrementTokenVersion();
            userRepository.save(user);
        });
    }

    @Transactional
    public LoginResult changePassword(AuthenticatedUserPrincipal principal, ChangePasswordRequest request) {
        User user = userRepository.findByIdWithTenant(principal.getUserId())
                .orElseThrow(() -> new BadCredentialsException("Authenticated user not found."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect.");
        }

        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw new IllegalArgumentException("New password must be different from your current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.incrementTokenVersion();
        User saved = userRepository.save(user);

        String refreshedToken = jwtUtil.generateToken(saved);
        return new LoginResult(toAuthResponse(saved), refreshedToken);
    }

    /**
     * Non-enumerating forgot-password acknowledgement.
     * In a multi-tenant employee platform without external SMTP configured, instructs the employee
     * to contact their General Manager (or Platform Admin for GMs) for a secure temporary reset.
     */
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        // Deliberately do not reveal whether the email exists in the database
        log.info("Password reset inquiry received for normalized identifier hash={}", normalizedEmail.hashCode());
    }

    public AuthResponse toAuthResponse(User user) {
        String hotelSlug = user.getHotel() != null ? user.getHotel().getSlug() : null;
        String hotelName = user.getHotel() != null ? user.getHotel().getName() : null;
        Long hotelId = user.getHotel() != null ? user.getHotel().getId() : null;
        Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        String deptName = user.getDepartment() != null ? user.getDepartment().getName() : null;

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .employeeCode(user.getEmployeeCode())
                .hotelId(hotelId)
                .hotelName(hotelName)
                .hotelSlug(hotelSlug)
                .departmentId(deptId)
                .departmentName(deptName)
                .mustChangePassword(user.isMustChangePassword())
                .redirectUrl(JwtUtil.computeRedirectUrl(user.getRole(), hotelSlug))
                .build();
    }
}
