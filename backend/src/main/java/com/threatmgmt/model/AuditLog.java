package com.threatmgmt.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    private String id;

    private String incidentId;

    private String actorUsername;

    private String actorName;

    private String action; // INCIDENT_CREATED, STATUS_UPDATED, ASSIGNED, PRIORITY_UPDATED, COMMENT_ADDED, EVIDENCE_UPLOADED, INCIDENT_DELETED

    private String description;

    private Map<String, Object> details;

    private LocalDateTime timestamp;
}
