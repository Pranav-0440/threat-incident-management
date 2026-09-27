package com.threatmgmt.controller;

import com.threatmgmt.dto.AuthRequest;
import com.threatmgmt.dto.AuthResponse;
import com.threatmgmt.model.User;
import com.threatmgmt.security.JwtUtil;
import com.threatmgmt.service.PasswordResetService;
import com.threatmgmt.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserService userService;

    @Mock
    private PasswordResetService passwordResetService;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(
                authenticationManager, jwtUtil, userService, passwordResetService);
    }

    @Test
    void login_validCredentials_authenticatesAndReturnsToken() {
        AuthRequest request = new AuthRequest("analyst1", "ValidPass123!");
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("analyst1");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);

        User user = User.builder()
                .id("u-1")
                .username("analyst1")
                .roles(List.of("ROLE_ANALYST"))
                .build();
        when(userService.findByUsername("analyst1")).thenReturn(user);
        when(jwtUtil.normalizeRoles(user.getRoles())).thenReturn(List.of("ROLE_ANALYST"));
        when(jwtUtil.generateToken("analyst1", List.of("ROLE_ANALYST"))).thenReturn("mocked.jwt.token");

        ResponseEntity<AuthResponse> response = controller.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("mocked.jwt.token", response.getBody().getToken());
        assertEquals("analyst1", response.getBody().getUsername());
        assertEquals(List.of("ROLE_ANALYST"), response.getBody().getRoles());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userService).findByUsername("analyst1");
    }

    @Test
    void login_invalidCredentials_throwsBadCredentialsException() {
        AuthRequest request = new AuthRequest("analyst1", "WrongPassword");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> controller.login(request));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userService, never()).findByUsername(any());
        verify(jwtUtil, never()).generateToken(any(), any());
    }
}
