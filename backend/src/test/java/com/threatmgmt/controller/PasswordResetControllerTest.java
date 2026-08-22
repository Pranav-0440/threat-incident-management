package com.threatmgmt.controller;

import com.threatmgmt.dto.ForgotPasswordRequest;
import com.threatmgmt.dto.ResetPasswordRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PasswordResetControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordResetService passwordResetService;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(
                authenticationManager, jwtUtil, userService, passwordEncoder, passwordResetService);
    }

    @Test
    void forgotPasswordReturnsGenericAcceptedResponse() {
        ResponseEntity<Map<String, String>> response = controller.forgotPassword(
                new ForgotPasswordRequest("analyst@example.com"));

        assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
        assertEquals(
                "If an account matches that identifier, a password reset link will be sent.",
                response.getBody().get("message"));
        verify(passwordResetService).requestReset("analyst@example.com");
    }

    @Test
    void resetPasswordDelegatesTokenValidationAndReturnsSuccess() {
        ResponseEntity<Map<String, String>> response = controller.resetPassword(
                new ResetPasswordRequest("one-time-token", "new-password"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Password reset successfully.", response.getBody().get("message"));
        verify(passwordResetService).resetPassword("one-time-token", "new-password");
    }
}
