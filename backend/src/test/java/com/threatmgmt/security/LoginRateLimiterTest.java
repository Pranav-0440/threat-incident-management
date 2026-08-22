package com.threatmgmt.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginRateLimiterTest {

    @Test
    void deniesTheSixthAttemptForTheSameIpAndAccount() {
        LoginRateLimiter limiter = new LoginRateLimiter(
                5, Duration.ofSeconds(60), Clock.fixed(Instant.parse("2026-08-22T00:00:00Z"), ZoneId.of("UTC")));

        for (int attempt = 0; attempt < 5; attempt++) {
            assertTrue(limiter.check("203.0.113.10", " analyst@example.com ").allowed());
        }

        LoginRateLimiter.RateLimitDecision denied = limiter.check("203.0.113.10", "ANALYST@EXAMPLE.COM");

        assertFalse(denied.allowed());
        assertEquals(60, denied.retryAfterSeconds());
    }

    @Test
    void keepsDifferentIpAndAccountBucketsIndependent() {
        LoginRateLimiter limiter = new LoginRateLimiter(
                1, Duration.ofSeconds(60), Clock.fixed(Instant.parse("2026-08-22T00:00:00Z"), ZoneId.of("UTC")));

        assertTrue(limiter.check("203.0.113.10", "analyst@example.com").allowed());
        assertTrue(limiter.check("203.0.113.11", "other@example.com").allowed());
    }

    @Test
    void resetAllowsSuccessfulAccountToTryAgain() {
        LoginRateLimiter limiter = new LoginRateLimiter(
                1, Duration.ofSeconds(60), Clock.fixed(Instant.parse("2026-08-22T00:00:00Z"), ZoneId.of("UTC")));

        assertTrue(limiter.check("203.0.113.10", "analyst@example.com").allowed());
        assertFalse(limiter.check("203.0.113.10", "analyst@example.com").allowed());

        limiter.reset("203.0.113.10", "analyst@example.com");

        assertTrue(limiter.check("203.0.113.10", "analyst@example.com").allowed());
    }

    @Test
    void expiresAttemptsAfterConfiguredWindow() {
        MutableClock clock = new MutableClock(Instant.parse("2026-08-22T00:00:00Z"));
        LoginRateLimiter limiter = new LoginRateLimiter(1, Duration.ofSeconds(60), clock);

        assertTrue(limiter.check("203.0.113.10", "analyst@example.com").allowed());
        assertFalse(limiter.check("203.0.113.10", "analyst@example.com").allowed());

        clock.advanceSeconds(60);

        assertTrue(limiter.check("203.0.113.10", "analyst@example.com").allowed());
    }

    @Test
    void rejectsInvalidConfiguration() {
        assertThrows(IllegalArgumentException.class,
                () -> new LoginRateLimiter(0, Duration.ofSeconds(60), Clock.systemUTC()));
        assertThrows(IllegalArgumentException.class,
                () -> new LoginRateLimiter(5, Duration.ZERO, Clock.systemUTC()));
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void advanceSeconds(long seconds) {
            instant = instant.plusSeconds(seconds);
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
