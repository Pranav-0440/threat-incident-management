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
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {

    private static final long MAX_FILE_SIZE = 8 * 1024 * 1024;
    private static final java.util.Set<String> ALLOWED_CONTENT_TYPES = java.util.Set.of(
            "application/json", "application/pdf", "image/gif", "image/jpeg", "image/png",
            "image/webp", "text/csv", "text/plain", "application/zip");

    private final AttachmentRepository attachmentRepository;
    private final AuditLogService auditLogService;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${supabase.s3.bucket}")
    private String bucketName;

    public Attachment uploadFile(String incidentId, MultipartFile file, String uploadedBy) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence file must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evidence file exceeds the 8 MB limit");
        }

        String originalFilename = StringUtils
                .cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
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

        if (incidentId == null || !incidentId.matches("[a-zA-Z0-9_-]+$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid incident ID format");
        }

       
        String key = "incidents/" + incidentId + "/" + storedFileName;

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putRequest,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        Attachment attachment = Attachment.builder()
                .incidentId(incidentId)
                .fileName(storedFileName)
                .originalName(originalFilename)
                .fileType(contentType)
                .fileSize(file.getSize())
                .fileUrl(null)
                .storagePath(key)
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

   
    public String getDownloadUrl(String id) {
        Attachment attachment = getAttachmentById(id);

        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(attachment.getStoragePath())
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .getObjectRequest(getRequest)
                .build();

        URL url = s3Presigner.presignGetObject(presignRequest).url();
        return url.toString();
    }

    public void deleteAttachment(String id, String requestingUser, boolean privileged) {
        Attachment attachment = getAttachmentById(id);
        if (!privileged && !requestingUser.equals(attachment.getUploadedBy())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the uploader or an administrator can delete evidence");
        }
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(attachment.getStoragePath())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to delete file from Supabase Storage: {}", e.getMessage());
        }
        attachmentRepository.delete(attachment);
    }
}