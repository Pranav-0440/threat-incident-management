package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Comment;
import com.threatmgmt.model.Incident;
import com.threatmgmt.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.threatmgmt.repository.IncidentRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

        private final CommentRepository commentRepository;
        private final AuditLogService auditLogService;
        private final IncidentRepository incidentRepository;
        private final NotificationService notificationService;


        public Comment addComment(String incidentId, String authorUsername, String authorFullName, String content) {

               String validContent = requireNonBlank(content, "Comment content");
               String validAuthorUsername = requireNonBlank(authorUsername, "Author username");

                Incident incident = incidentRepository.findById(incidentId)
                                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));

                Comment comment = Comment.builder()
                                .incidentId(incidentId)
                                .authorUsername(validAuthorUsername)
                                .authorFullName(authorFullName)
                                .content(validContent)
                                .createdAt(LocalDateTime.now())
                                .build();
                Comment saved = commentRepository.save(comment);

                auditLogService.logEvent(
                                incidentId,
                                validAuthorUsername,
                                authorFullName,
                                "COMMENT_ADDED",
                                authorFullName + " added a comment to the investigation",
                                null);

                if (incident.getAssignedTo() != null
                                && !incident.getAssignedTo().equals(validAuthorUsername)) {

                        notificationService.sendNotification(
                                        incident.getAssignedTo(),
                                        "COMMENT_ADDED",
                                        "New comment",
                                        authorFullName + " added a new comment to your incident",
                                        incidentId);
                }

                return saved;
        }

         private String requireNonBlank(String value, String fieldName){
                if (value == null || value.isBlank()) {
                        throw new IllegalArgumentException(fieldName + " cannot be empty");
                }
                return value;
        }

        public List<Comment> getCommentsForIncident(String incidentId) {
                return commentRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId);
        }

        public void deleteComment(String commentId, String requestingUser, boolean privileged) {
                Comment comment = commentRepository.findById(commentId)
                                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

                if (!privileged && !requestingUser.equals(comment.getAuthorUsername())) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                        "Only the comment author or an administrator can delete comments");
                }

                auditLogService.logEvent(
                                comment.getIncidentId(),
                                requestingUser,
                                requestingUser,
                                "COMMENT_DELETED",
                                "Comment deleted",
                                null);
                commentRepository.delete(comment);
        }
}
