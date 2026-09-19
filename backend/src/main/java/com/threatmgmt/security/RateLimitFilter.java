package com.threatmgmt.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.annotation.Value;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import java.io.IOException;
import java.time.Duration;

import org.springframework.http.HttpStatus;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Duration BUCKET_TTL = Duration.ofMinutes(10);
    private static final long MAX_TRACKED_IPS = 100_000;
 
    private final Cache<String, Bucket> ipBucketMap = Caffeine.newBuilder()
            .expireAfterAccess(BUCKET_TTL)
            .maximumSize(MAX_TRACKED_IPS)
            .build();


    @Value("${app.security.trusted-proxy-hops:0}")
    private int trustedProxyHops;

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

        String ipAddr = resolveClientIp(request);
        Bucket bucket = ipBucketMap.get(ipAddr, k -> createNewBucket());
        boolean allowed = bucket.tryConsume(1);
  

        if (allowed) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            return;
        }

    }

    private String resolveClientIp(HttpServletRequest request) {
        if (trustedProxyHops <= 0) {
            return request.getRemoteAddr();
        }
 
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return request.getRemoteAddr();
        }
 
        String[] hops = forwardedFor.split(",");
        int clientIndex = hops.length - 1 - trustedProxyHops;
 
        if (clientIndex >= 0 && clientIndex < hops.length) {
            return hops[clientIndex].trim();
        }

        return request.getRemoteAddr();
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