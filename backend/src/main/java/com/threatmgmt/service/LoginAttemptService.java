package com.threatmgmt.service;

import com.threatmgmt.exception.RateLimitExceededException;
import com.threatmgmt.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginAttemptService {

    private final LoginRateLimiter loginRateLimiter;
    private final AuditLogService auditLogService;

    public void checkAllowed(HttpServletRequest request, String accountIdentifier) {
        String clientIp = clientIp(request);
        LoginRateLimiter.RateLimitDecision decision = loginRateLimiter.check(clientIp, accountIdentifier);
        if (!decision.allowed()) {
            recordRateLimitViolation(clientIp, accountIdentifier, decision.retryAfterSeconds());
            throw new RateLimitExceededException(decision.retryAfterSeconds());
        }
    }

    public void recordSuccessfulLogin(HttpServletRequest request, String accountIdentifier) {
        loginRateLimiter.reset(clientIp(request), accountIdentifier);
    }

    private void recordRateLimitViolation(String clientIp, String accountIdentifier, long retryAfterSeconds) {
        try {
            auditLogService.logEvent(
                    null,
                    "anonymous",
                    "Anonymous",
                    "LOGIN_RATE_LIMITED",
                    "Login rate limit exceeded",
                    Map.of(
                            "clientIp", clientIp,
                            "accountIdentifier", accountIdentifier == null ? "unknown" : accountIdentifier,
                            "retryAfterSeconds", retryAfterSeconds));
        } catch (RuntimeException ex) {
            log.warn("Unable to persist login rate-limit audit event", ex);
        }
    }

    private String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }
}
