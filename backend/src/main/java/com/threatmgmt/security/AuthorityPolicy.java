package com.threatmgmt.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class AuthorityPolicy {

    private static final String ROLE_PREFIX = "ROLE_";
    private static final String ANALYST = ROLE_PREFIX + "ANALYST";
    private static final String ADMIN = ROLE_PREFIX + "ADMIN";
    private static final String SUPER_ADMIN = ROLE_PREFIX + "SUPER_ADMIN";
    private static final Set<String> SUPPORTED_ROLES = Set.of(ANALYST, ADMIN, SUPER_ADMIN);

    private AuthorityPolicy() {
    }

    public static List<String> normalizeRoles(Collection<String> roles) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        if (roles != null) {
            roles.stream()
                    .map(AuthorityPolicy::canonicalRole)
                    .filter(SUPPORTED_ROLES::contains)
                    .forEach(normalized::add);
        }

        if (normalized.contains(SUPER_ADMIN)) {
            normalized.add(ADMIN);
            normalized.add(ANALYST);
        } else if (normalized.contains(ADMIN)) {
            normalized.add(ANALYST);
        }

        return List.copyOf(normalized);
    }

    public static List<GrantedAuthority> toAuthorities(Collection<String> roles) {
        return normalizeRoles(roles).stream()
                .map(SimpleGrantedAuthority::new)
                .map(authority -> (GrantedAuthority) authority)
                .toList();
    }

    private static String canonicalRole(String role) {
        if (role == null || role.isBlank()) {
            return "";
        }
        String upperRole = role.trim().toUpperCase(Locale.ROOT);
        return upperRole.startsWith(ROLE_PREFIX) ? upperRole : ROLE_PREFIX + upperRole;
    }
}
