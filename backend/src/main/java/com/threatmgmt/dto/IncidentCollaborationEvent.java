package com.threatmgmt.dto;

import java.time.LocalDateTime;

public record IncidentCollaborationEvent(
        String eventType,
        String incidentId,
        String title,
        String previousStatus,
        String status,
        String updatedBy,
        LocalDateTime occurredAt) {
}
