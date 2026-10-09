package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Notification;
import com.threatmgmt.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testNotification = Notification.builder()
                .id("notif-1")
                .recipientUsername("analyst_bob")
                .title("New Alert")
                .message("Suspicious access detected")
                .type("ALERT")
                .incidentId("inc-1")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("markAllAsRead delegates to repository updateAllNotificationsAsReadByUsername")
    void markAllAsRead_callsRepository() {
        notificationService.markAllAsRead("analyst_bob");

        verify(notificationRepository, times(1)).updateAllNotificationsAsReadByUsername("analyst_bob");
    }

    @Test
    @DisplayName("markAsRead successfully sets read to true when requesting user is recipient")
    void markAsRead_success() {
        when(notificationRepository.findById("notif-1")).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.markAsRead("notif-1", "analyst_bob");

        assertThat(testNotification.isRead()).isTrue();
        verify(notificationRepository).save(testNotification);
    }

    @Test
    @DisplayName("markAsRead throws AccessDeniedException when requesting user is not recipient")
    void markAsRead_unauthorized_throwsAccessDenied() {
        when(notificationRepository.findById("notif-1")).thenReturn(Optional.of(testNotification));

        assertThatThrownBy(() -> notificationService.markAsRead("notif-1", "intruder_user"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Notification does not belong to the authenticated user");

        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("markAsRead throws ResourceNotFoundException when notification ID not found")
    void markAsRead_notFound_throwsException() {
        when(notificationRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead("non-existent", "analyst_bob"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getUnreadCount returns unread notifications count for recipient")
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countByRecipientUsernameAndReadFalse("analyst_bob")).thenReturn(5L);

        long count = notificationService.getUnreadCount("analyst_bob");

        assertThat(count).isEqualTo(5L);
        verify(notificationRepository).countByRecipientUsernameAndReadFalse("analyst_bob");
    }

    @Test
    @DisplayName("getUserNotifications returns descending ordered notifications")
    void getUserNotifications_returnsList() {
        when(notificationRepository.findByRecipientUsernameOrderByCreatedAtDesc("analyst_bob"))
                .thenReturn(List.of(testNotification));

        List<Notification> result = notificationService.getUserNotifications("analyst_bob");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("New Alert");
    }
}
