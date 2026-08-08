package com.threatmgmt.service;

import com.threatmgmt.model.Notification;
import com.threatmgmt.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification createNotification(String recipientUsername, String title, String message, String type, String incidentId) {
        Notification notification = Notification.builder()
                .recipientUsername(recipientUsername)
                .title(title)
                .message(message)
                .type(type)
                .incidentId(incidentId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        return notificationRepository.save(notification);
    }

    public Notification sendNotification(String recipientUsername, String type, String title, String message, String incidentId) {
        return createNotification(recipientUsername, title, message, type, incidentId);
    }

    public List<Notification> getUserNotifications(String username) {
        return notificationRepository.findByRecipientUsernameOrderByCreatedAtDesc(username);
    }

    public long getUnreadCount(String username) {
        return notificationRepository.countByRecipientUsernameAndReadFalse(username);
    }

    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(String username) {
        List<Notification> notifications = notificationRepository.findByRecipientUsernameOrderByCreatedAtDesc(username);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }
}
