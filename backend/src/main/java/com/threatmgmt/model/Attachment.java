package com.threatmgmt.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    @Id
    private String id;

    private String incidentId;

    private String fileName;

    private String originalName;

    private String fileType; // image/png, application/pdf, text/plain, etc.

    private long fileSize;

    private String fileUrl;

    private String storagePath;

    private String uploadedBy;

    private LocalDateTime uploadedAt;
}
