package com.threatmgmt.controller;

import com.threatmgmt.model.AuditLog;
import com.threatmgmt.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/incident/{incidentId}")
    @PreAuthorize("hasPermission(#incidentId, 'incident', 'read')")
    public ResponseEntity<List<AuditLog>> getLogsForIncident(@PathVariable String incidentId) {
        return ResponseEntity.ok(auditLogService.getLogsForIncident(incidentId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/page")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<AuditLog>> getPaginatedLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int boundedPage = Math.max(page, 0);
        int boundedSize = Math.min(Math.max(size, 1), 100);
        return ResponseEntity.ok(auditLogService.getPaginatedLogs(
                PageRequest.of(boundedPage, boundedSize, Sort.by(Sort.Direction.DESC, "timestamp"))
        ));
    }
}
