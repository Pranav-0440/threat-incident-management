package com.threatmgmt.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItem {

    @Column(name = "id")
    private String id;

    @Column(name = "title")
    private String title;

    @Column(name = "completed")
    private boolean completed;

    @Column(name = "completed_by")
    private String completedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
