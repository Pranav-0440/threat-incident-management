package com.threatmgmt.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "incidents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    @Column(columnDefinition = "TEXT")
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

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "incident_tags", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "tag")
    private List<String> tags;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "incident_related", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "related_id")
    private List<String> relatedIncidentIds;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "incident_watchers", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "watcher")
    private List<String> watchers;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    private int riskScore;      // 0–100, calculated by service

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}