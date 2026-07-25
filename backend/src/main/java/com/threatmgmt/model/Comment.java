package com.threatmgmt.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    private String id;

    @NotBlank(message = "Incident ID is required")
    private String incidentId;

    private String authorUsername;

    private String authorFullName;

    @NotBlank(message = "Comment content cannot be empty")
    private String content;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
