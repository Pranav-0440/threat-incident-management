package com.threatmgmt.controller;

import com.threatmgmt.model.AuditLog;
import com.threatmgmt.service.AuditLogService;
import lombok.RequiredArgsConstructor;
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }
}
