package com.threatmgmt.controller;

import com.threatmgmt.dto.AuthRequest;
import com.threatmgmt.dto.AuthResponse;
import com.threatmgmt.dto.ForgotPasswordRequest;
import com.threatmgmt.dto.RegisterRequest;
import com.threatmgmt.dto.ResetPasswordRequest;
import com.threatmgmt.exception.InvalidPasswordException;
import com.threatmgmt.model.User;
import com.threatmgmt.security.JwtUtil;
import com.threatmgmt.service.PasswordResetService;
import com.threatmgmt.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        String token = jwtUtil.generateToken(user.getUsername(), user.getRoles());

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .roles(user.getRoles())
                .build();

        return ResponseEntity.status(201).body(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.identifier());
        return ResponseEntity.accepted().body(java.util.Map.of(
                "message", "If an account matches that identifier, a password reset link will be sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(java.util.Map.of("message", "Password reset successfully."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        // 1. Fetch user from database by username or email
        User user;
        try {
            user = userService.findByUsername(request.getUsername());
        } catch (UsernameNotFoundException ex) {
            throw new UsernameNotFoundException("User not found with username or email: " + request.getUsername());
        }

        // 2. Verify password against BCrypt hash in database
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidPasswordException("Invalid password. Please check your credentials and try again.");
        }

        // 3. Authenticate spring security session
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername(), request.getPassword()));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRoles());

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .roles(user.getRoles())
                .build();

        return ResponseEntity.ok(response);
    }
}
