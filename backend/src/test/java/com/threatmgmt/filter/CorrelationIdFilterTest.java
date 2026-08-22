package com.threatmgmt.filter;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CorrelationIdFilterTest {

    private final CorrelationIdFilter filter = new CorrelationIdFilter();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void propagatesSafeClientCorrelationIdAndCleansMdc() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(CorrelationIdFilter.HEADER_NAME, "incident-42:read");
        MockHttpServletResponse response = new MockHttpServletResponse();
        final String[] idSeenByChain = new String[1];
        FilterChain chain = (requestInChain, responseInChain) -> idSeenByChain[0] = MDC.get(CorrelationIdFilter.MDC_KEY);

        filter.doFilter(request, response, chain);

        assertEquals("incident-42:read", response.getHeader(CorrelationIdFilter.HEADER_NAME));
        assertEquals("incident-42:read", idSeenByChain[0]);
        assertFalse(MDC.getCopyOfContextMap() != null && MDC.getCopyOfContextMap().containsKey(CorrelationIdFilter.MDC_KEY));
    }

    @Test
    void replacesInvalidClientCorrelationIdWithGeneratedUuid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(CorrelationIdFilter.HEADER_NAME, "bad\nvalue");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (requestInChain, responseInChain) -> {
        });

        String responseId = response.getHeader(CorrelationIdFilter.HEADER_NAME);
        assertNotNull(responseId);
        assertNotEquals("bad\nvalue", responseId);
        assertTrue(responseId.matches("[0-9a-f-]{36}"));
    }
}
