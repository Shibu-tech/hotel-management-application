package com.hotel.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window login rate limiter keyed by client IP and identifier.
 * Protects /api/auth/login against brute-force and credential stuffing attacks.
 */
@Component
public class LoginRateLimiter {

    private final int maxAttempts;
    private final long windowSeconds;
    private final ConcurrentHashMap<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${app.auth.rate-limit-max-attempts:15}") int maxAttempts,
            @Value("${app.auth.rate-limit-window-seconds:60}") long windowSeconds) {
        this.maxAttempts = Math.max(1, maxAttempts);
        this.windowSeconds = Math.max(1, windowSeconds);
    }

    public boolean isAllowed(String key) {
        if (key == null || key.isBlank()) {
            return true;
        }
        long now = Instant.now().getEpochSecond();
        long cutoff = now - windowSeconds;

        Deque<Long> timestamps = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() <= cutoff) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxAttempts) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }

    public void clear(String key) {
        if (key != null) {
            attempts.remove(key);
        }
    }

    public void clearAll() {
        attempts.clear();
    }
}
