package com.threatmgmt.service;

import com.threatmgmt.exception.PasswordResetTokenException;
import com.threatmgmt.model.PasswordResetToken;
import com.threatmgmt.model.User;
import com.threatmgmt.repository.PasswordResetTokenRepository;
import com.threatmgmt.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ObjectProvider<PasswordResetEmailSender> emailSenderProvider;

    @Mock
    private PasswordResetEmailSender emailSender;

    @Test
    void unknownIdentifierReturnsWithoutRevealingAccountExistence() {
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("missing", "missing"))
                .thenReturn(Optional.empty());
        PasswordResetService service = newService();

        service.requestReset(" missing ");

        verify(tokenRepository, never()).save(any());
        verify(emailSenderProvider, never()).getIfAvailable();
    }

    @Test
    void validIdentifierStoresOnlyHashAndSendsShortLivedResetLink() {
        User user = User.builder().username("analyst").email("analyst@example.com").build();
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("analyst", "analyst"))
                .thenReturn(Optional.of(user));
        when(emailSenderProvider.getIfAvailable()).thenReturn(emailSender);
        PasswordResetService service = newService();
        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);

        service.requestReset(" analyst ");

        verify(tokenRepository).deleteByUser(user);
        verify(tokenRepository).save(tokenCaptor.capture());
        verify(emailSender).send(eq("analyst@example.com"), urlCaptor.capture());
        PasswordResetToken stored = tokenCaptor.getValue();
        String rawToken = urlCaptor.getValue().substring(urlCaptor.getValue().indexOf("token=") + 6);

        assertEquals(64, stored.getTokenHash().length());
        assertNotEquals(rawToken, stored.getTokenHash());
        assertEquals(service.hashToken(rawToken), stored.getTokenHash());
        assertTrue(stored.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(14)));
        assertTrue(stored.getExpiresAt().isBefore(LocalDateTime.now().plusMinutes(16)));
        assertFalse(stored.isUsed());
    }

    @Test
    void validTokenUpdatesPasswordAndMarksTokenUsed() {
        User user = User.builder().username("analyst").password("old-hash").build();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .tokenHash("stored-hash")
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");
        PasswordResetService service = newService();
        String rawToken = "one-time-token";
        when(tokenRepository.findByTokenHash(service.hashToken(rawToken))).thenReturn(Optional.of(resetToken));

        service.resetPassword(rawToken, "new-password");

        verify(passwordEncoder).encode("new-password");
        verify(userRepository).save(user);
        verify(tokenRepository).save(resetToken);
        assertEquals("new-hash", user.getPassword());
        assertTrue(resetToken.isUsed());
    }

    @Test
    void expiredOrUnknownTokenIsRejected() {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());
        PasswordResetService service = newService();

        assertThrows(PasswordResetTokenException.class,
                () -> service.resetPassword("unknown", "new-password"));

        PasswordResetToken expired = PasswordResetToken.builder()
                .user(User.builder().username("analyst").build())
                .expiresAt(LocalDateTime.now().minusSeconds(1))
                .used(false)
                .build();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(expired));

        assertThrows(PasswordResetTokenException.class,
                () -> service.resetPassword("expired", "new-password"));
    }

    private PasswordResetService newService() {
        return new PasswordResetService(userRepository, tokenRepository, passwordEncoder, emailSenderProvider);
    }
}
