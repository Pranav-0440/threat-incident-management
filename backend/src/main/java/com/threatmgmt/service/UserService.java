package com.threatmgmt.service;

import com.threatmgmt.dto.RegisterRequest;
import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Incident;
import com.threatmgmt.model.User;
import com.threatmgmt.repository.IncidentRepository;
import com.threatmgmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    @Cacheable(value = "userDetails", key = "#usernameOrEmail")
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        log.debug("Cache MISS - Loading user from database: {}", usernameOrEmail);

        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with username or email: " + usernameOrEmail));

        Set<String> allRoles = new HashSet<>(user.getRoles() != null ? user.getRoles() : List.of("ROLE_ANALYST"));
        if (allRoles.contains("ROLE_SUPER_ADMIN")) {
            allRoles.add("ROLE_ADMIN");
            allRoles.add("ROLE_ANALYST");
        }
        if (allRoles.contains("ROLE_ADMIN")) {
            allRoles.add("ROLE_ANALYST");
        }

        List<SimpleGrantedAuthority> authorities = allRoles.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }

    @CacheEvict(value = "userDetails", allEntries = true)
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        boolean isFirstUser = userRepository.count() == 0;
        String requestedRole = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole().trim().toUpperCase()
                : "ANALYST";

        if (!requestedRole.equals("ADMIN") && !requestedRole.equals("ANALYST")) {
            requestedRole = "ANALYST";
        }

        String role = isFirstUser ? "SUPER_ADMIN" : requestedRole;

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

    public User findByUsername(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with username or email: " + usernameOrEmail));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @CacheEvict(value = "userDetails", allEntries = true)
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
