package com.threatmgmt.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CorsConfigTest {

    @Test
    void configuresOnlyExplicitOriginsWithCredentials() {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOrigins", "https://app.example.com, http://localhost:5173");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/incidents");
        CorsConfiguration configuration = source.getCorsConfiguration(request);

        assertEquals(java.util.List.of("https://app.example.com", "http://localhost:5173"),
                configuration.getAllowedOrigins());
        assertTrue(configuration.getAllowCredentials());
    }

    @Test
    void rejectsWildcardOriginWhenCredentialsAreEnabled() {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOrigins", "*");

        assertThrows(IllegalStateException.class, corsConfig::corsConfigurationSource);
    }
}
