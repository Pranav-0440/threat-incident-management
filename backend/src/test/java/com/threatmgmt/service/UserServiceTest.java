package com.threatmgmt.service;

import com.threatmgmt.dto.RegisterRequest;
import com.threatmgmt.model.User;
import com.threatmgmt.repository.IncidentRepository;
import com.threatmgmt.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("registerUser assigns ROLE_ANALYST when client requests ADMIN on non-first user")
    void registerUser_blocksPrivilegeEscalation_assignsAnalyst() {
        when(userRepository.existsByUsername("attacker")).thenReturn(false);
        when(userRepository.existsByEmail("attacker@example.com")).thenReturn(false);
        when(userRepository.count()).thenReturn(5L); // Non-first user
        when(passwordEncoder.encode("Secret123!")).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegisterRequest request = RegisterRequest.builder()
                .username("attacker")
                .password("Secret123!")
                .email("attacker@example.com")
                .fullName("Attacker User")
                .role("ADMIN")
                .build();

        User saved = userService.registerUser(request);

        assertThat(saved.getRoles()).containsExactly("ROLE_ANALYST");
        assertThat(saved.getRoles()).doesNotContain("ROLE_ADMIN");
        assertThat(saved.getRoles()).doesNotContain("ROLE_SUPER_ADMIN");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("registerUser bootstraps the first user as ROLE_SUPER_ADMIN")
    void registerUser_firstUser_bootstrapsSuperAdmin() {
        when(userRepository.existsByUsername("bootstrap_admin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@threatguard.io")).thenReturn(false);
        when(userRepository.count()).thenReturn(0L); // First user
        when(passwordEncoder.encode("AdminPass123!")).thenReturn("hashed_admin");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegisterRequest request = RegisterRequest.builder()
                .username("bootstrap_admin")
                .password("AdminPass123!")
                .email("admin@threatguard.io")
                .fullName("Bootstrap Admin")
                .role("ANALYST")
                .build();

        User saved = userService.registerUser(request);

        assertThat(saved.getRoles()).containsExactly("ROLE_SUPER_ADMIN");
    }

    @Test
    @DisplayName("registerUser throws exception when username already exists")
    void registerUser_duplicateUsername_throwsException() {
        when(userRepository.existsByUsername("existing_user")).thenReturn(true);

        RegisterRequest request = RegisterRequest.builder()
                .username("existing_user")
                .password("Pass123!")
                .build();

        assertThatThrownBy(() -> userService.registerUser(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerUser throws exception when email already registered")
    void registerUser_duplicateEmail_throwsException() {
        when(userRepository.existsByUsername("new_user")).thenReturn(false);
        when(userRepository.existsByEmail("used@example.com")).thenReturn(true);

        RegisterRequest request = RegisterRequest.builder()
                .username("new_user")
                .password("Pass123!")
                .email("used@example.com")
                .build();

        assertThatThrownBy(() -> userService.registerUser(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("loadUserByUsername expands SUPER_ADMIN to include ADMIN and ANALYST authorities")
    void loadUserByUsername_expandsAuthorities() {
        User superAdmin = User.builder()
                .username("root")
                .password("hash")
                .roles(List.of("ROLE_SUPER_ADMIN"))
                .build();

        when(userRepository.findByUsername("root")).thenReturn(Optional.of(superAdmin));

        var userDetails = userService.loadUserByUsername("root");

        assertThat(userDetails.getAuthorities().stream().map(Object::toString).toList())
                .containsExactlyInAnyOrder("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_ANALYST");
    }
}
