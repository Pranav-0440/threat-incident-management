package com.threatmgmt.controller;

import com.threatmgmt.model.Comment;
import com.threatmgmt.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/incidents/{incidentId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<Comment> addComment(
            @PathVariable String incidentId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String content = payload.get("content");
        String username = authentication.getName();
        return ResponseEntity.status(201)
                .body(commentService.addComment(incidentId, username, username, content));
    }

    @GetMapping
    public ResponseEntity<List<Comment>> getComments(@PathVariable String incidentId) {
        return ResponseEntity.ok(commentService.getCommentsForIncident(incidentId));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String incidentId,
            @PathVariable String commentId,
            Authentication authentication) {
        commentService.deleteComment(commentId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
