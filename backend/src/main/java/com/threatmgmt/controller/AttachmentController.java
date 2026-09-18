package com.threatmgmt.controller;

import com.threatmgmt.model.Attachment;
import com.threatmgmt.security.IncidentPermissionEvaluator;
import com.threatmgmt.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
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

    @GetMapping("/{id}/download")
    @org.springframework.security.access.prepost.PreAuthorize("hasPermission(#id, 'attachment', 'read')")
    public ResponseEntity<Void> downloadFile(@PathVariable String id) {
        try {
            String presignedUrl = attachmentService.getDownloadUrl(id);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(presignedUrl))
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
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