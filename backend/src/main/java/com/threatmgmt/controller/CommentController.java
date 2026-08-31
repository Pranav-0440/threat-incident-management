package com.threatmgmt.controller;

import com.threatmgmt.model.Comment;
import com.threatmgmt.service.CommentService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/incidents/{incidentId}/comments")
@RequiredArgsConstructor
@Validated
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @PreAuthorize("(hasRole('ANALYST') or hasRole('ADMIN')) and hasPermission(#incidentId, 'incident', 'write')")
    public ResponseEntity<Comment> addComment(
            @PathVariable @NotBlank String incidentId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String content = payload.get("content");
        String username = authentication.getName();
        return ResponseEntity.status(201)
                .body(commentService.addComment(incidentId, username, username, content));
    }

    @GetMapping
    @PreAuthorize("hasPermission(#incidentId, 'incident', 'read')")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String incidentId) {
        return ResponseEntity.ok(commentService.getCommentsForIncident(incidentId));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasPermission(#incidentId, 'incident', 'read')")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String incidentId,
            @PathVariable String commentId,
            Authentication authentication) {
        boolean privileged = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ROLE_SUPER_ADMIN"));
        commentService.deleteComment(commentId, authentication.getName(), privileged);
        return ResponseEntity.noContent().build();
    }
}
