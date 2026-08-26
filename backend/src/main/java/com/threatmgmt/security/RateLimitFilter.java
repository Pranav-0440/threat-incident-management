package com.threatmgmt.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> ipBucketMap = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        if (!requestPath.equals("/api/v1/auth/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ipAddr = request.getRemoteAddr();
        Bucket bucket = ipBucketMap.computeIfAbsent(ipAddr, k -> createNewBucket());
        boolean allowed = bucket.tryConsume(1);

        if (allowed) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            return;
        }

    }

    private Bucket createNewBucket() {

        Bandwidth limit = Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofMinutes(1))
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}