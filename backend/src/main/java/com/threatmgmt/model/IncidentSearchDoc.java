package com.threatmgmt.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidentSearchDoc {

    private String id;

    private String title;

    private String description;

    private String severity;

    private String category;

    private String status;

    private LocalDateTime createdAt;
}
