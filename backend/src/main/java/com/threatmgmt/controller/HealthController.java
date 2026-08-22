package com.threatmgmt.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping({"", "/", "/readiness"})
    public HealthResponse health() {
        return new HealthResponse("UP", Instant.now());
    }

    public record HealthResponse(String status, Instant timestamp) {
    }
}
