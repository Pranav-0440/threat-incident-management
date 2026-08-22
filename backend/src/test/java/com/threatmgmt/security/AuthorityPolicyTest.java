package com.threatmgmt.security;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;

class AuthorityPolicyTest {

    @Test
    void normalizesSupportedRolesAndExpandsHierarchy() {
        assertIterableEquals(
                List.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_ANALYST"),
                AuthorityPolicy.normalizeRoles(List.of("admin", "ROLE_SUPER_ADMIN", "ROLE_UNKNOWN")));
    }

    @Test
    void unknownOrEmptyRolesFallBackToAnalyst() {
        assertEquals(List.of("ROLE_ANALYST"), AuthorityPolicy.normalizeRoles(List.of("ROLE_OWNER", "")));
        assertEquals(List.of("ROLE_ANALYST"), AuthorityPolicy.normalizeRoles(null));
    }
}
