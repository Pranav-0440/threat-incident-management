package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Attachment;
import com.threatmgmt.repository.AttachmentRepository;
import com.threatmgmt.repository.IncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttachmentServiceTest {

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @InjectMocks
    private AttachmentService attachmentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(attachmentService, "bucketName", "test-bucket");
    }

    @Test
    void uploadFile_success_persistsAttachmentAndLogsAudit() throws IOException {
        String incidentId = "inc-123";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "evidence.pcap.png",
                "image/png",
                "binary-image-data".getBytes()
        );

        when(incidentRepository.existsById(incidentId)).thenReturn(true);
        when(attachmentRepository.save(any(Attachment.class))).thenAnswer(inv -> inv.getArgument(0));

        Attachment result = attachmentService.uploadFile(incidentId, file, "analyst1");

        assertNotNull(result);
        assertEquals(incidentId, result.getIncidentId());
        assertEquals("evidence.pcap.png", result.getOriginalName());
        assertEquals("analyst1", result.getUploadedBy());
        assertEquals("image/png", result.getFileType());

        verify(s3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        verify(attachmentRepository, times(1)).save(any(Attachment.class));
        verify(auditLogService, times(1)).logEvent(
                eq(incidentId),
                eq("analyst1"),
                eq("analyst1"),
                eq("EVIDENCE_UPLOADED"),
                contains("evidence.pcap.png"),
                isNull()
        );
    }

    @Test
    void uploadFile_nonExistentIncident_throwsResourceNotFound() {
        String incidentId = "non-existent-id";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "screenshot.png",
                "image/png",
                "test-data".getBytes()
        );

        when(incidentRepository.existsById(incidentId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () ->
                attachmentService.uploadFile(incidentId, file, "analyst1"));

        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        verify(attachmentRepository, never()).save(any());
        verify(auditLogService, never()).logEvent(any(), any(), any(), any(), any(), any());
    }

    @Test
    void uploadFile_emptyFile_throwsResponseStatusException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        assertThrows(ResponseStatusException.class, () ->
                attachmentService.uploadFile("inc-123", emptyFile, "analyst1"));
    }

    @Test
    void uploadFile_unsupportedContentType_throwsResponseStatusException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/x-msdownload",
                "data".getBytes()
        );

        assertThrows(ResponseStatusException.class, () ->
                attachmentService.uploadFile("inc-123", file, "analyst1"));
    }

    @Test
    void deleteAttachment_authorizedUploader_deletesS3AndDatabaseAndLogsAudit() {
        String attachmentId = "att-123";
        Attachment attachment = Attachment.builder()
                .id(attachmentId)
                .incidentId("inc-100")
                .fileName("stored-uuid.png")
                .originalName("screenshot.png")
                .storagePath("incidents/inc-100/stored-uuid.png")
                .uploadedBy("analyst1")
                .build();

        when(attachmentRepository.findById(attachmentId)).thenReturn(Optional.of(attachment));

        attachmentService.deleteAttachment(attachmentId, "analyst1", false);

        verify(s3Client, times(1)).deleteObject(any(DeleteObjectRequest.class));
        verify(attachmentRepository, times(1)).delete(attachment);
        verify(auditLogService, times(1)).logEvent(
                eq("inc-100"),
                eq("analyst1"),
                eq("analyst1"),
                eq("EVIDENCE_DELETED"),
                contains("screenshot.png"),
                isNull()
        );
    }

    @Test
    void deleteAttachment_adminUser_succeedsEvenIfNotOriginalUploader() {
        String attachmentId = "att-123";
        Attachment attachment = Attachment.builder()
                .id(attachmentId)
                .incidentId("inc-100")
                .fileName("stored-uuid.png")
                .originalName("logs.txt")
                .storagePath("incidents/inc-100/stored-uuid.png")
                .uploadedBy("analyst1")
                .build();

        when(attachmentRepository.findById(attachmentId)).thenReturn(Optional.of(attachment));

        attachmentService.deleteAttachment(attachmentId, "adminUser", true);

        verify(s3Client, times(1)).deleteObject(any(DeleteObjectRequest.class));
        verify(attachmentRepository, times(1)).delete(attachment);
        verify(auditLogService, times(1)).logEvent(
                eq("inc-100"),
                eq("adminUser"),
                eq("adminUser"),
                eq("EVIDENCE_DELETED"),
                contains("logs.txt"),
                isNull()
        );
    }

    @Test
    void deleteAttachment_unauthorizedUser_throwsAccessDeniedException() {
        String attachmentId = "att-123";
        Attachment attachment = Attachment.builder()
                .id(attachmentId)
                .incidentId("inc-100")
                .fileName("stored-uuid.png")
                .originalName("report.pdf")
                .storagePath("incidents/inc-100/stored-uuid.png")
                .uploadedBy("analyst1")
                .build();

        when(attachmentRepository.findById(attachmentId)).thenReturn(Optional.of(attachment));

        assertThrows(AccessDeniedException.class, () ->
                attachmentService.deleteAttachment(attachmentId, "unauthorizedAnalyst", false));

        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
        verify(attachmentRepository, never()).delete(any());
        verify(auditLogService, never()).logEvent(any(), any(), any(), any(), any(), any());
    }
}
