package com.threatmgmt.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter();
    }

    @Test
    void unprotectedPath_bypassesRateLimiter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/incidents");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicInteger chainCalls = new AtomicInteger(0);
        FilterChain chain = (req, res) -> chainCalls.incrementAndGet();

        filter.doFilter(request, response, chain);

        assertEquals(1, chainCalls.get());
        assertEquals(HttpStatus.OK.value(), response.getStatus());
    }

    @Test
    void rateLimitedEndpoints_allowUpToCapacity() throws Exception {
        String[] authPaths = {
                "/api/v1/auth/login",
                "/api/v1/auth/register",
                "/api/v1/auth/forgot-password",
                "/api/v1/auth/reset-password"
        };

        for (String path : authPaths) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
            request.setRemoteAddr("192.168.1.100");
            MockHttpServletResponse response = new MockHttpServletResponse();
            AtomicInteger chainCalls = new AtomicInteger(0);

            filter.doFilter(request, response, (req, res) -> chainCalls.incrementAndGet());

            assertEquals(1, chainCalls.get(), "Expected request to pass through for " + path);
            assertEquals(HttpStatus.OK.value(), response.getStatus());
        }
    }

    @Test
    void exceedingCapacity_returns429WithStructuredJsonAndRetryAfter() throws Exception {
        String clientIp = "10.0.0.99";

        // Consume all 5 allowed tokens
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.setRemoteAddr(clientIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, (r, s) -> {});
            assertEquals(HttpStatus.OK.value(), res.getStatus());
        }

        // 6th request must be blocked with HTTP 429
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        blockedReq.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        AtomicInteger chainCalls = new AtomicInteger(0);

        filter.doFilter(blockedReq, blockedRes, (r, s) -> chainCalls.incrementAndGet());

        assertEquals(0, chainCalls.get(), "Filter chain should not be executed when blocked");
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), blockedRes.getStatus());
        assertEquals("application/json", blockedRes.getContentType());
        assertEquals("60", blockedRes.getHeader("Retry-After"));
        assertTrue(blockedRes.getContentAsString().contains("Rate limit exceeded"));
        assertTrue(blockedRes.getContentAsString().contains("429"));
    }

    @Test
    void differentIps_haveIndependentBuckets() throws Exception {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";

        // Exhaust quota for ip1
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.setRemoteAddr(ip1);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, (r, s) -> {});
        }

        // ip1 is now blocked
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        blockedReq.setRemoteAddr(ip1);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blockedReq, blockedRes, (r, s) -> {});
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), blockedRes.getStatus());

        // ip2 should still be allowed
        MockHttpServletRequest allowedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        allowedReq.setRemoteAddr(ip2);
        MockHttpServletResponse allowedRes = new MockHttpServletResponse();
        AtomicInteger ip2Calls = new AtomicInteger(0);
        filter.doFilter(allowedReq, allowedRes, (r, s) -> ip2Calls.incrementAndGet());

        assertEquals(1, ip2Calls.get());
        assertEquals(HttpStatus.OK.value(), allowedRes.getStatus());
    }

    @Test
    void pathWithTrailingSlash_isCorrectlyNormalizedAndRateLimited() throws Exception {
        String clientIp = "10.0.0.50";

        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login/");
            req.setRemoteAddr(clientIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, (r, s) -> {});
            assertEquals(HttpStatus.OK.value(), res.getStatus());
        }

        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login/");
        blockedReq.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blockedReq, blockedRes, (r, s) -> {});
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), blockedRes.getStatus());
    }
}
