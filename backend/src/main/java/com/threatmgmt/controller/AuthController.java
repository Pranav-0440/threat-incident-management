package com.threatmgmt.controller;

import com.threatmgmt.dto.AuthRequest;
import com.threatmgmt.dto.AuthResponse;
import com.threatmgmt.dto.ForgotPasswordRequest;
import com.threatmgmt.dto.RegisterRequest;
import com.threatmgmt.dto.ResetPasswordRequest;
import com.threatmgmt.model.User;
import com.threatmgmt.security.JwtUtil;
import com.threatmgmt.service.PasswordResetService;
import com.threatmgmt.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        List<String> effectiveRoles = jwtUtil.normalizeRoles(user.getRoles());
        String token = jwtUtil.generateToken(user.getUsername(), effectiveRoles);

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .roles(effectiveRoles)
                .build();

        return ResponseEntity.status(201).body(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.identifier());
        return ResponseEntity.accepted().body(Map.of(
                "message", "If an account matches that identifier, a password reset link will be sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        // Authenticate credentials through Spring Security's AuthenticationManager
        // This validates credentials via DaoAuthenticationProvider with a single BCrypt evaluation
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userService.findByUsername(authentication.getName());

        List<String> effectiveRoles = jwtUtil.normalizeRoles(user.getRoles());
        String token = jwtUtil.generateToken(user.getUsername(), effectiveRoles);

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .roles(effectiveRoles)
                .build();

        return ResponseEntity.ok(response);
    }
}
