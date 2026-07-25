package com.threatmgmt.service;

import com.threatmgmt.dto.RegisterRequest;
import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Incident;
import com.threatmgmt.model.User;
import com.threatmgmt.repository.IncidentRepository;
import com.threatmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final IncidentRepository incidentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found: " + username));

        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(SimpleGrantedAuthority::new)
                .toList();

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }

    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        // Hardened Security Enforcement (Option 2):
        // Public registration ALWAYS assigns the ANALYST role to prevent privilege escalation.
        // Even if a malicious request attempts to send "role": "ADMIN", it is strictly ignored on the server.
        // The first registered account or initial seed admin gets SUPER_ADMIN automatically if no users exist.
        boolean isFirstUser = userRepository.count() == 0;
        String role = isFirstUser ? "SUPER_ADMIN" : "ANALYST";

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .roles(List.of("ROLE_" + role))
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new user: {} with enforced security role: {}", saved.getUsername(), role);
        return saved;
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found: " + username));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUserRole(String userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        String formattedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
        user.setRoles(List.of(formattedRole));
        User updated = userRepository.save(user);
        log.info("Updated role for user: {} to {}", user.getUsername(), formattedRole);
        return updated;
    }

    public List<Map<String, Object>> getAnalystWorkloads() {
        List<User> users = userRepository.findAll();
        List<Incident> allIncidents = incidentRepository.findAll();

        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            long assigned = allIncidents.stream()
                    .filter(i -> u.getUsername().equals(i.getAssignedTo()))
                    .count();
            long openAssigned = allIncidents.stream()
                    .filter(i -> u.getUsername().equals(i.getAssignedTo()) && ("OPEN".equals(i.getStatus()) || "INVESTIGATING".equals(i.getStatus())))
                    .count();

            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("fullName", u.getFullName() != null ? u.getFullName() : u.getUsername());
            map.put("email", u.getEmail());
            map.put("roles", u.getRoles());
            map.put("totalAssigned", assigned);
            map.put("activeAssigned", openAssigned);
            result.add(map);
        }
        return result;
    }
}
