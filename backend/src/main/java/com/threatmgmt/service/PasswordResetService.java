package com.threatmgmt.service;

import com.threatmgmt.exception.PasswordResetTokenException;
import com.threatmgmt.model.PasswordResetToken;
import com.threatmgmt.model.User;
import com.threatmgmt.repository.PasswordResetTokenRepository;
import com.threatmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final int TOKEN_BYTES = 32;
    private static final long TOKEN_LIFETIME_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<PasswordResetEmailSender> emailSenderProvider;

    @Value("${app.password-reset.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl = "http://localhost:5173";

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void requestReset(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return;
        }

        String normalizedIdentifier = identifier.trim();
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(
                normalizedIdentifier, normalizedIdentifier).orElse(null);
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        tokenRepository.deleteByUser(user);
        String rawToken = generateToken();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .tokenHash(hashToken(rawToken))
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(TOKEN_LIFETIME_MINUTES))
                .used(false)
                .build();
        tokenRepository.save(resetToken);

        PasswordResetEmailSender sender = emailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("Password reset requested for user {} but mail delivery is disabled", user.getUsername());
            return;
        }

        try {
            sender.send(user.getEmail(), buildResetUrl(rawToken));
        } catch (RuntimeException ex) {
            tokenRepository.delete(resetToken);
            log.error("Unable to deliver password reset email for user {}", user.getUsername(), ex);
        }
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new PasswordResetTokenException();
        }

        PasswordResetToken resetToken = tokenRepository.findByTokenHash(hashToken(rawToken.trim()))
                .orElseThrow(PasswordResetTokenException::new);
        if (resetToken.isUsed() || !resetToken.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new PasswordResetTokenException();
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }

    String generateToken() {
        byte[] tokenBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    String hashToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                hex.append(String.format("%02x", value));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private String buildResetUrl(String rawToken) {
        String baseUrl = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
        return baseUrl + "/reset-password?token=" + rawToken;
    }
}
