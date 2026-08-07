package com.threatmgmt.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "incidents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Incident {

    @Id
    private String id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String location;

    private Double latitude;

    private Double longitude;

    private String severity;    // LOW, MEDIUM, HIGH, CRITICAL

    private String priority;    // P1, P2, P3, P4

    private String category;    // WORKPLACE_VIOLENCE, THREAT, SUSPICIOUS_ACTIVITY, CYBER_THREAT, PHYSICAL_SECURITY

    private String status;      // OPEN, INVESTIGATING, WAITING_EVIDENCE, RESOLVED, CLOSED

    private String reportedBy;

    private String assignedTo;      // Username of assigned analyst

    private String assignedToName;  // Full name of assigned analyst

    private String department;      // SOC Team, IT Security, etc.

    private List<String> tags;

    private List<ChecklistItem> checklist;

    private List<String> relatedIncidentIds;

    private List<String> watchers;

    private String aiSummary;

    private int riskScore;      // 0–100, calculated by service

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChecklistItem {
        private String id;
        private String title;
        private boolean completed;
        private String completedBy;
        private LocalDateTime completedAt;
    }
}