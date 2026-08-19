package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Comment;
import com.threatmgmt.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final AuditLogService auditLogService;

    public Comment addComment(String incidentId, String authorUsername, String authorFullName, String content) {
        Comment comment = Comment.builder()
                .incidentId(incidentId)
                .authorUsername(authorUsername)
                .authorFullName(authorFullName)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();
        Comment saved = commentRepository.save(comment);

        auditLogService.logEvent(incidentId, authorUsername, authorFullName, "COMMENT_ADDED",
                authorFullName + " added a comment to the investigation", null);

        return saved;
    }

    public List<Comment> getCommentsForIncident(String incidentId) {
        return commentRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId);
    }

    public void deleteComment(String commentId, String requestingUser, boolean privileged) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));
        if (!privileged && !requestingUser.equals(comment.getAuthorUsername())) {
            throw new org.springframework.security.access.AccessDeniedException("Only the comment author or an administrator can delete comments");
        }
        commentRepository.delete(comment);
    }
}
