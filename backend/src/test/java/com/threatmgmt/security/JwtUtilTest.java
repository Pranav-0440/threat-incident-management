package com.threatmgmt.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        String secret = Base64.getEncoder().encodeToString(
                "threatguard-test-secret-key-32-bytes".getBytes(StandardCharsets.UTF_8));
        ReflectionTestUtils.setField(jwtUtil, "secret", secret);
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3_600_000L);
    }

    @Test
    void superAdminRolesExpandToEffectiveAuthoritiesInToken() {
        String token = jwtUtil.generateToken("root", List.of("ROLE_SUPER_ADMIN"));

        assertIterableEquals(
                List.of("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_ANALYST"),
                jwtUtil.extractRoles(token));
    }

    @Test
    void adminRolesExpandToAnalystAuthorityInToken() {
        String token = jwtUtil.generateToken("admin", List.of("ADMIN"));

        assertIterableEquals(List.of("ROLE_ADMIN", "ROLE_ANALYST"), jwtUtil.extractRoles(token));
    }

    @Test
    void emptyRolesDefaultToAnalystAuthority() {
        assertEquals(List.of("ROLE_ANALYST"), jwtUtil.normalizeRoles(List.of()));
    }
}
