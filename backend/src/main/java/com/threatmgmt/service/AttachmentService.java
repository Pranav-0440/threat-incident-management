package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Attachment;
import com.threatmgmt.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final AuditLogService auditLogService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public Attachment uploadFile(String incidentId, MultipartFile file, String uploadedBy) throws IOException {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = "";
        int i = originalFilename.lastIndexOf('.');
        if (i > 0) {
            extension = originalFilename.substring(i);
        }
        String storedFileName = UUID.randomUUID().toString() + extension;

        Path targetDir = Paths.get(uploadDir, "incidents", incidentId).toAbsolutePath().normalize();
        Files.createDirectories(targetDir);

        Path targetLocation = targetDir.resolve(storedFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        Attachment attachment = Attachment.builder()
                .incidentId(incidentId)
                .fileName(storedFileName)
                .originalName(originalFilename)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .fileUrl("/api/v1/attachments/files/" + storedFileName)
                .storagePath(targetLocation.toString())
                .uploadedBy(uploadedBy)
                .uploadedAt(LocalDateTime.now())
                .build();

        Attachment saved = attachmentRepository.save(attachment);

        auditLogService.logEvent(incidentId, uploadedBy, uploadedBy, "EVIDENCE_UPLOADED",
                "Uploaded evidence attachment: " + originalFilename, null);

        return saved;
    }

    public List<Attachment> getAttachmentsForIncident(String incidentId) {
        return attachmentRepository.findByIncidentIdOrderByUploadedAtDesc(incidentId);
    }

    public Attachment getAttachmentById(String id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", id));
    }

    public void deleteAttachment(String id) {
        Attachment attachment = getAttachmentById(id);
        try {
            Path path = Paths.get(attachment.getStoragePath());
            Files.deleteIfExists(path);
        } catch (Exception e) {
            log.warn("Failed to delete physical file: {}", e.getMessage());
        }
        attachmentRepository.delete(attachment);
    }
}
