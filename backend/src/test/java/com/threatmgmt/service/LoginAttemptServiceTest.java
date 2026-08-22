package com.threatmgmt.service;

import com.threatmgmt.exception.RateLimitExceededException;
import com.threatmgmt.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginAttemptServiceTest {

    @Mock
    private LoginRateLimiter loginRateLimiter;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private HttpServletRequest request;

    @Test
    void deniedAttemptIsAuditedAndExposesRetryInterval() {
        when(request.getRemoteAddr()).thenReturn("203.0.113.10");
        when(loginRateLimiter.check("203.0.113.10", "analyst@example.com"))
                .thenReturn(new LoginRateLimiter.RateLimitDecision(false, 42));

        LoginAttemptService service = new LoginAttemptService(loginRateLimiter, auditLogService);

        RateLimitExceededException exception = assertThrows(
                RateLimitExceededException.class,
                () -> service.checkAllowed(request, "analyst@example.com"));

        assertEquals(42, exception.getRetryAfterSeconds());
        verify(auditLogService).logEvent(
                isNull(),
                eq("anonymous"),
                eq("Anonymous"),
                eq("LOGIN_RATE_LIMITED"),
                eq("Login rate limit exceeded"),
                argThat(details -> details.equals(Map.of(
                        "clientIp", "203.0.113.10",
                        "accountIdentifier", "analyst@example.com",
                        "retryAfterSeconds", 42L))));
    }

    @Test
    void auditFailureDoesNotTurnRateLimitIntoAnInternalServerError() {
        when(request.getRemoteAddr()).thenReturn("203.0.113.10");
        when(loginRateLimiter.check(any(), any()))
                .thenReturn(new LoginRateLimiter.RateLimitDecision(false, 10));
        doThrow(new IllegalStateException("database unavailable"))
                .when(auditLogService)
                .logEvent(any(), any(), any(), any(), any(), any());

        LoginAttemptService service = new LoginAttemptService(loginRateLimiter, auditLogService);

        RateLimitExceededException exception = assertThrows(
                RateLimitExceededException.class,
                () -> service.checkAllowed(request, "analyst@example.com"));

        assertEquals(10, exception.getRetryAfterSeconds());
    }

    @Test
    void successfulLoginResetsBothBuckets() {
        when(request.getRemoteAddr()).thenReturn("203.0.113.10");
        LoginAttemptService service = new LoginAttemptService(loginRateLimiter, auditLogService);

        service.recordSuccessfulLogin(request, "analyst@example.com");

        verify(loginRateLimiter).reset("203.0.113.10", "analyst@example.com");
    }
}
