package com.hotel.backend.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + authException.getMessage() + "\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"Access denied. Requires ADMIN role.\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Pre-flight options requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/hotels/public-list").permitAll()
                .requestMatchers("/api/hotels/*/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hotels/qr").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hotels/qr/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hotels/*/qr").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hotels/*/qr/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hotels/*/qr/url").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hotels/*/qr/download").permitAll()
                .requestMatchers("/api/health").permitAll()
                // Admin endpoints strictly protected by role ADMIN
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
