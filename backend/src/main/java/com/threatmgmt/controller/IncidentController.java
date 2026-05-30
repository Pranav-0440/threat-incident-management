package com.threatmgmt.controller;

import com.threatmgmt.model.Incident;
import com.threatmgmt.model.IncidentSearchDoc;
import com.threatmgmt.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping
    @PreAuthorize("hasRole('ANALYST') or hasRole('ADMIN')")
    public ResponseEntity<Incident> create(
            @Valid @RequestBody Incident incident,
            Authentication authentication) {
        incident.setReportedBy(authentication.getName());
        return ResponseEntity.status(201).body(incidentService.createIncident(incident));
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getAll() {
        return ResponseEntity.ok(incidentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getById(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.findById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<IncidentSearchDoc>> search(@RequestParam String q) {
        return ResponseEntity.ok(incidentService.searchIncidents(q));
    }

    @GetMapping("/severity/{severity}")
    public ResponseEntity<List<Incident>> getBySeverity(@PathVariable String severity) {
        return ResponseEntity.ok(incidentService.findBySeverity(severity.toUpperCase()));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Incident>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(incidentService.findByStatus(status.toUpperCase()));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(incidentService.getStats());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ANALYST') or hasRole('ADMIN')")
    public ResponseEntity<Incident> update(
            @PathVariable String id,
            @Valid @RequestBody Incident incident) {
        return ResponseEntity.ok(incidentService.updateIncident(id, incident));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Incident> updateStatus(
            @PathVariable String id,
            @RequestParam String status) {
        return ResponseEntity.ok(incidentService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        incidentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
