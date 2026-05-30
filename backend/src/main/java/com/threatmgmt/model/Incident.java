package com.threatmgmt.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

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

    private String severity;    // LOW, MEDIUM, HIGH, CRITICAL

    private String category;    // WORKPLACE_VIOLENCE, THREAT, SUSPICIOUS_ACTIVITY

    private String status;      // OPEN, INVESTIGATING, RESOLVED

    private String reportedBy;

    private int riskScore;      // 0–100, calculated by service

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
