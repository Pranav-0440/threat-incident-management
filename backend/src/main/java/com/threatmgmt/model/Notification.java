package com.threatmgmt.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    private String recipientUsername;

    private String title;

    private String message;

    private String type; // INCIDENT_ASSIGNED, STATUS_CHANGED, COMMENT_ADDED, CRITICAL_ALERT

    private String incidentId;

    private boolean read;

    private LocalDateTime createdAt;
}
