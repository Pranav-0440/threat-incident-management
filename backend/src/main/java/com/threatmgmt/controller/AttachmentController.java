package com.threatmgmt.controller;

import com.threatmgmt.model.Attachment;
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

    @PostMapping("/upload/{incidentId}")
    public ResponseEntity<Attachment> upload(
            @PathVariable String incidentId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        String username = authentication != null ? authentication.getName() : "anonymous";
        return ResponseEntity.status(201)
                .body(attachmentService.uploadFile(incidentId, file, username));
    }

    @GetMapping("/incident/{incidentId}")
    public ResponseEntity<List<Attachment>> getByIncident(@PathVariable String incidentId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsForIncident(incidentId));
    }

    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Attachment attachment = attachmentService.getAttachmentsForIncident("")
                    .stream()
                    .filter(a -> a.getFileName().equals(fileName))
                    .findFirst()
                    .orElse(null);

            Path filePath;
            if (attachment != null) {
                filePath = Paths.get(attachment.getStoragePath());
            } else {
                filePath = Paths.get("uploads").resolve(fileName).toAbsolutePath();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                String contentType = attachment != null ? attachment.getFileType() : "application/octet-stream";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + (attachment != null ? attachment.getOriginalName() : fileName) + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable String id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.noContent().build();
    }
}
