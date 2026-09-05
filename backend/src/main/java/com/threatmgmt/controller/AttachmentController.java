package com.threatmgmt.controller;

import com.threatmgmt.model.Attachment;
import com.threatmgmt.security.IncidentPermissionEvaluator;
import com.threatmgmt.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/v1/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final IncidentPermissionEvaluator incidentPermissionEvaluator;

    @PostMapping("/upload/{incidentId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasPermission(#incidentId, 'incident', 'read')")
    public ResponseEntity<Attachment> upload(
            @PathVariable String incidentId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        String username = authentication != null ? authentication.getName() : "anonymous";
        return ResponseEntity.status(201)
                .body(attachmentService.uploadFile(incidentId, file, username));
    }

    @GetMapping("/incident/{incidentId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasPermission(#incidentId, 'incident', 'read')")
    public ResponseEntity<List<Attachment>> getByIncident(@PathVariable String incidentId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsForIncident(incidentId));
    }

    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String fileName,
            Authentication authentication) {
        Attachment attachment = attachmentService.getAttachmentByFileName(fileName);
        if (!incidentPermissionEvaluator.hasPermission(authentication, attachment.getIncidentId(), "read")) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have permission to read this incident evidence");
        }

        try {
            Path filePath = attachmentService.resolveStoredPath(attachment);
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = attachment.getFileType() != null
                    ? attachment.getFileType()
                    : MediaType.APPLICATION_OCTET_STREAM_VALUE;
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + attachment.getOriginalName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable String id, Authentication authentication) {
        boolean privileged = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ROLE_SUPER_ADMIN"));
        attachmentService.deleteAttachment(id, authentication.getName(), privileged);
        return ResponseEntity.noContent().build();
    }
}
