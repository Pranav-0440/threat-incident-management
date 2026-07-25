package com.threatmgmt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CorsConfig.class);

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,https://*.vercel.app,https://*.onrender.com,https://*.netlify.app}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> originsList = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(originsList);
        log.info("CORS configured with allowedOriginPatterns: {}", originsList);

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
