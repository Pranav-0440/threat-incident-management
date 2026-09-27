package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Comment;
import com.threatmgmt.model.Incident;
import com.threatmgmt.repository.CommentRepository;
import com.threatmgmt.repository.IncidentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CommentService commentService;

    @Test
    void addComment_success_savesAndLogs() {
        Incident incident = Incident.builder()
                .id("inc-1")
                .assignedTo("analystB")
                .build();
        when(incidentRepository.findById("inc-1")).thenReturn(Optional.of(incident));
        when(commentRepository.save(any(Comment.class))).thenAnswer(i -> i.getArgument(0));

        Comment saved = commentService.addComment("inc-1", "analystA", "Analyst A", "Investigating payload");

        assertNotNull(saved);
        assertEquals("inc-1", saved.getIncidentId());
        assertEquals("analystA", saved.getAuthorUsername());
        assertEquals("Investigating payload", saved.getContent());
        verify(notificationService).sendNotification(eq("analystB"), eq("COMMENT_ADDED"), any(), any(), eq("inc-1"));
        verify(auditLogService).logEvent(eq("inc-1"), eq("analystA"), eq("Analyst A"), eq("COMMENT_ADDED"), any(), any());
    }

    @Test
    void addComment_blankContent_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> commentService.addComment("inc-1", "analystA", "Analyst A", "   "));
    }

    @Test
    void deleteComment_asAuthor_succeeds() {
        Comment comment = Comment.builder()
                .id("comm-1")
                .incidentId("inc-1")
                .authorUsername("analystA")
                .createdAt(LocalDateTime.now())
                .build();
        when(commentRepository.findById("comm-1")).thenReturn(Optional.of(comment));

        commentService.deleteComment("inc-1", "comm-1", "analystA", false);

        verify(commentRepository).delete(comment);
        verify(auditLogService).logEvent(eq("inc-1"), eq("analystA"), eq("analystA"), eq("COMMENT_DELETED"), any(), any());
    }

    @Test
    void deleteComment_asAdmin_succeedsEvenIfNotAuthor() {
        Comment comment = Comment.builder()
                .id("comm-1")
                .incidentId("inc-1")
                .authorUsername("analystA")
                .createdAt(LocalDateTime.now())
                .build();
        when(commentRepository.findById("comm-1")).thenReturn(Optional.of(comment));

        commentService.deleteComment("inc-1", "comm-1", "admin1", true);

        verify(commentRepository).delete(comment);
        verify(auditLogService).logEvent(eq("inc-1"), eq("admin1"), eq("admin1"), eq("COMMENT_DELETED"), any(), any());
    }

    @Test
    void deleteComment_wrongIncidentId_throwsResourceNotFoundException() {
        Comment comment = Comment.builder()
                .id("comm-1")
                .incidentId("inc-2")
                .authorUsername("analystA")
                .build();
        when(commentRepository.findById("comm-1")).thenReturn(Optional.of(comment));

        assertThrows(ResourceNotFoundException.class,
                () -> commentService.deleteComment("inc-1", "comm-1", "analystA", true));

        verify(commentRepository, never()).delete(any());
        verify(auditLogService, never()).logEvent(any(), any(), any(), any(), any(), any());
    }

    @Test
    void deleteComment_unauthorizedUser_throwsAccessDeniedException() {
        Comment comment = Comment.builder()
                .id("comm-1")
                .incidentId("inc-1")
                .authorUsername("analystA")
                .build();
        when(commentRepository.findById("comm-1")).thenReturn(Optional.of(comment));

        assertThrows(AccessDeniedException.class,
                () -> commentService.deleteComment("inc-1", "comm-1", "analystB", false));

        verify(commentRepository, never()).delete(any());
    }
}
