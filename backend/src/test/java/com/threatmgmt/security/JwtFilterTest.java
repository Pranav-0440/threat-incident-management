package com.threatmgmt.security;

import com.threatmgmt.service.UserService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserService userService;

    @Test
    void usesDatabaseAuthoritiesInsteadOfTokenRoleClaims() throws Exception {
        UserDetails databaseUser = User.withUsername("alice")
                .password("encoded")
                .authorities("ROLE_ANALYST")
                .build();
        when(jwtUtil.extractUsername("signed-token")).thenReturn("alice");
        when(userService.loadUserByUsername("alice")).thenReturn(databaseUser);
        when(jwtUtil.isTokenValid("signed-token", databaseUser)).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer signed-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (requestInChain, responseInChain) -> {
        };

        new JwtFilter(jwtUtil, userService).doFilter(request, response, chain);

        assertTrue(SecurityContextHolder.getContext().getAuthentication().isAuthenticated());
        assertEquals("ROLE_ANALYST", SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().iterator().next().getAuthority());
        verify(jwtUtil, never()).extractRoles(eq("signed-token"));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }
}
