package com.threatmgmt.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
public class LoginRateLimiter {

    private final int maxAttempts;
    private final Duration window;
    private final Clock clock;
    private final Map<String, AttemptWindow> windows = new HashMap<>();

    public LoginRateLimiter(
            @Value("${app.rate-limit.login.max-attempts:5}") int maxAttempts,
            @Value("${app.rate-limit.login.window-seconds:60}") long windowSeconds) {
        this(maxAttempts, Duration.ofSeconds(windowSeconds), Clock.systemUTC());
    }

    LoginRateLimiter(int maxAttempts, Duration window, Clock clock) {
        if (maxAttempts < 1) {
            throw new IllegalArgumentException("maxAttempts must be positive");
        }
        if (window.isNegative() || window.isZero()) {
            throw new IllegalArgumentException("window must be positive");
        }
        this.maxAttempts = maxAttempts;
        this.window = window;
        this.clock = clock;
    }

    public synchronized RateLimitDecision check(String clientIp, String accountIdentifier) {
        Instant now = clock.instant();
        removeExpired(now);

        String ipKey = "ip:" + normalize(clientIp, "unknown");
        String accountKey = "account:" + normalize(accountIdentifier, "unknown");
        AttemptWindow ipWindow = windows.computeIfAbsent(ipKey, ignored -> new AttemptWindow(now));
        AttemptWindow accountWindow = windows.computeIfAbsent(accountKey, ignored -> new AttemptWindow(now));

        if (ipWindow.isFull(now, window, maxAttempts) || accountWindow.isFull(now, window, maxAttempts)) {
            long retryAfterSeconds = Math.max(
                    ipWindow.retryAfterSeconds(now, window),
                    accountWindow.retryAfterSeconds(now, window));
            return new RateLimitDecision(false, Math.max(1, retryAfterSeconds));
        }

        ipWindow.record(now, window);
        accountWindow.record(now, window);
        return new RateLimitDecision(true, 0);
    }

    public synchronized void reset(String clientIp, String accountIdentifier) {
        windows.remove("ip:" + normalize(clientIp, "unknown"));
        windows.remove("account:" + normalize(accountIdentifier, "unknown"));
    }

    private void removeExpired(Instant now) {
        windows.entrySet().removeIf(entry -> entry.getValue().isExpired(now, window));
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase(java.util.Locale.ROOT);
    }

    public record RateLimitDecision(boolean allowed, long retryAfterSeconds) {
    }

    private static final class AttemptWindow {
        private Instant startedAt;
        private int attempts;

        private AttemptWindow(Instant startedAt) {
            this.startedAt = startedAt;
        }

        private boolean isFull(Instant now, Duration window, int maxAttempts) {
            resetIfExpired(now, window);
            return attempts >= maxAttempts;
        }

        private void record(Instant now, Duration window) {
            resetIfExpired(now, window);
            attempts++;
        }

        private long retryAfterSeconds(Instant now, Duration window) {
            resetIfExpired(now, window);
            return Math.max(1, Duration.between(now, startedAt.plus(window)).toSeconds());
        }

        private boolean isExpired(Instant now, Duration window) {
            return !now.isBefore(startedAt.plus(window));
        }

        private void resetIfExpired(Instant now, Duration window) {
            if (isExpired(now, window)) {
                startedAt = now;
                attempts = 0;
            }
        }
    }
}
