package com.hotel.backend.service;

import com.hotel.backend.dto.AuthResponse;
import com.hotel.backend.dto.LoginRequest;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.UserRepository;
import com.hotel.backend.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is inactive. Please contact support.");
        }

        // Multi-tenant validation: if user is not global ADMIN and a specific hotelSlug is requested
        if (user.getRole() != Role.ADMIN && request.getHotelSlug() != null && !request.getHotelSlug().isBlank()) {
            String requestedSlug = request.getHotelSlug().trim().toLowerCase();
            if (user.getHotel() == null || !user.getHotel().getSlug().equalsIgnoreCase(requestedSlug)) {
                throw new BadCredentialsException("User account does not belong to the selected hotel tenant: " + requestedSlug);
            }
        }

        String token = jwtUtil.generateToken(user);
        String hotelSlug = user.getHotel() != null ? user.getHotel().getSlug() : null;
        String hotelName = user.getHotel() != null ? user.getHotel().getName() : null;
        Long hotelId = user.getHotel() != null ? user.getHotel().getId() : null;

        String redirectUrl = JwtUtil.computeRedirectUrl(user.getRole(), hotelSlug);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .hotelId(hotelId)
                .hotelName(hotelName)
                .hotelSlug(hotelSlug)
                .redirectUrl(redirectUrl)
                .build();
    }
}
