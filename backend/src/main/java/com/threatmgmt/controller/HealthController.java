package com.threatmgmt.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @Autowired(required = false)
    private RedisConnectionFactory redisConnectionFactory;

    @GetMapping({"", "/", "/liveness"})
    public ResponseEntity<HealthResponse> liveness() {
        return ResponseEntity.ok(new HealthResponse("UP", Instant.now()));
    }

    @GetMapping("/readiness")
    public ResponseEntity<HealthResponse> readiness() {
        Map<String, Object> components = new LinkedHashMap<>();
        boolean isOverallHealthy = true;

        // Check PostgreSQL database connectivity
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                if (conn != null && conn.isValid(2)) {
                    components.put("database", Map.of("status", "UP", "details", "Database connection valid"));
                } else {
                    isOverallHealthy = false;
                    components.put("database", Map.of("status", "DOWN", "error", "Database connection validation failed"));
                }
            } catch (Exception e) {
                isOverallHealthy = false;
                components.put("database", Map.of("status", "DOWN", "error", e.getMessage() != null ? e.getMessage() : "Connection failed"));
            }
        } else {
            components.put("database", Map.of("status", "UNKNOWN", "details", "DataSource not configured"));
        }

        // Check Redis connectivity if configured
        if (redisConnectionFactory != null) {
            try (RedisConnection connection = redisConnectionFactory.getConnection()) {
                String pingResponse = connection != null ? connection.ping() : null;
                if ("PONG".equalsIgnoreCase(pingResponse)) {
                    components.put("redis", Map.of("status", "UP", "details", "Redis connection valid"));
                } else {
                    components.put("redis", Map.of("status", "DEGRADED", "details", "Unexpected ping: " + pingResponse));
                }
            } catch (Exception e) {
                components.put("redis", Map.of("status", "DOWN", "error", e.getMessage() != null ? e.getMessage() : "Redis connection failed"));
            }
        }

        String overallStatus = isOverallHealthy ? "UP" : "DOWN";
        HttpStatus httpStatus = isOverallHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

        return ResponseEntity.status(httpStatus).body(new HealthResponse(overallStatus, Instant.now(), components));
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record HealthResponse(String status, Instant timestamp, Map<String, Object> components) {
        public HealthResponse(String status, Instant timestamp) {
            this(status, timestamp, null);
        }
    }
}
