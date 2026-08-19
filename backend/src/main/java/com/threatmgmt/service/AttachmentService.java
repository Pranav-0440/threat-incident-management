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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final java.util.Set<String> ALLOWED_CONTENT_TYPES = java.util.Set.of(
            "application/json", "application/pdf", "image/gif", "image/jpeg", "image/png",
            "image/webp", "text/csv", "text/plain", "application/zip");

    private final AttachmentRepository attachmentRepository;
    private final AuditLogService auditLogService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public Attachment uploadFile(String incidentId, MultipartFile file, String uploadedBy) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence file must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence file exceeds the 10 MB limit");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        if (originalFilename.isBlank() || originalFilename.equals(".") || originalFilename.equals("..")
                || originalFilename.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence filename is invalid");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence file type is not supported");
        }
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
                .fileType(contentType)
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

    public void deleteAttachment(String id, String requestingUser, boolean privileged) {
        Attachment attachment = getAttachmentById(id);
        if (!privileged && !requestingUser.equals(attachment.getUploadedBy())) {
            throw new org.springframework.security.access.AccessDeniedException("Only the uploader or an administrator can delete evidence");
        }
        try {
            Path path = Paths.get(attachment.getStoragePath());
            Files.deleteIfExists(path);
        } catch (Exception e) {
            log.warn("Failed to delete physical file: {}", e.getMessage());
        }
        attachmentRepository.delete(attachment);
    }
}
