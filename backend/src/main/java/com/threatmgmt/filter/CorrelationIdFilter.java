package com.threatmgmt.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Correlation-ID";
    public static final String MDC_KEY = "correlationId";
    private static final Pattern SAFE_CORRELATION_ID = Pattern.compile("[A-Za-z0-9._:-]{1,128}");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String correlationId = getOrGenerateCorrelationId(request.getHeader(HEADER_NAME));
        response.setHeader(HEADER_NAME, correlationId);
        try {
            MDC.put(MDC_KEY, correlationId);
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    private String getOrGenerateCorrelationId(String requestedCorrelationId) {
        if (requestedCorrelationId != null && SAFE_CORRELATION_ID.matcher(requestedCorrelationId).matches()) {
            return requestedCorrelationId;
        }
        return UUID.randomUUID().toString();
    }
}
