package com.threatmgmt.controller;

import com.threatmgmt.model.User;
import com.threatmgmt.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUsersWithWorkload() {
        return ResponseEntity.ok(userService.getAnalystWorkloads());
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<User> updateUserRole(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        String role = payload.get("role");
        return ResponseEntity.ok(userService.updateUserRole(id, role));
    }
}
