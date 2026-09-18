package com.threatmgmt.repository;

import com.threatmgmt.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByRecipientUsernameOrderByCreatedAtDesc(String recipientUsername);
    long countByRecipientUsernameAndReadFalse(String recipientUsername);
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientUsername = :username")
    void updateAllNotificationsAsReadByUsername(String username);
}
