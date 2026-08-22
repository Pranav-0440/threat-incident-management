package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Incident;
import com.threatmgmt.model.IncidentSearchDoc;
import com.threatmgmt.repository.IncidentRepository;
import com.threatmgmt.repository.IncidentSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private final IncidentRepository incidentRepo;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Autowired(required = false)
    private IncidentSearchRepository searchRepo;

    public Incident createIncident(Incident incident) {
        incident.setCreatedAt(LocalDateTime.now());
        incident.setStatus("OPEN");
        incident.setRiskScore(calculateRiskScore(incident));
        if (incident.getPriority() == null || incident.getPriority().isEmpty()) {
            incident.setPriority(calculatePriority(incident));
        }
        if (incident.getDepartment() == null || incident.getDepartment().isEmpty()) {
            incident.setDepartment("SOC Team");
        }

        Incident saved = incidentRepo.save(incident);
        log.info("Created incident: {} with risk score: {} and priority: {}", saved.getId(), saved.getRiskScore(), saved.getPriority());

        // Sync with Elasticsearch if available
        indexToElasticsearch(saved);

        auditLogService.logEvent(saved.getId(), incident.getReportedBy(), incident.getReportedBy(), "INCIDENT_CREATED",
                "Incident reported by " + incident.getReportedBy() + ": " + saved.getTitle(), null);

        return saved;
    }

    public List<Incident> getAll() {
        return incidentRepo.findAll();
    }

    public List<Incident> getAll(String username, boolean privileged) {
        return privileged ? incidentRepo.findAll() : incidentRepo.findByAssignedToOrReportedBy(username, username);
    }

    public Incident findById(String id) {
        return incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));
    }

    public Incident findById(String id, String username, boolean privileged) {
        Incident incident = findById(id);
        if (!privileged && !isReadableBy(incident, username)) {
            throw new ResourceNotFoundException("Incident", "id", id);
        }
        return incident;
    }

    public List<Incident> findBySeverity(String severity) {
        return incidentRepo.findBySeverity(severity);
    }

    public List<Incident> findBySeverity(String severity, String username, boolean privileged) {
        return getAll(username, privileged).stream()
                .filter(incident -> severity.equalsIgnoreCase(incident.getSeverity()))
                .toList();
    }

    public List<Incident> findByStatus(String status) {
        return incidentRepo.findByStatus(status);
    }

    public List<Incident> findByStatus(String status, String username, boolean privileged) {
        return getAll(username, privileged).stream()
                .filter(incident -> status.equalsIgnoreCase(incident.getStatus()))
                .toList();
    }

    public List<IncidentSearchDoc> searchIncidents(String query) {
        return searchIncidents(query, null, true);
    }

    public List<IncidentSearchDoc> searchIncidents(String query, String username, boolean privileged) {
        if (privileged && searchRepo != null) {
            try {
                List<IncidentSearchDoc> docs = searchRepo.findByTitleContainingOrDescriptionContaining(query, query);
                if (docs != null && !docs.isEmpty()) {
                    return docs;
                }
            } catch (Exception e) {
                log.warn("Elasticsearch query failed, falling back to Supabase PostgreSQL native search: {}", e.getMessage());
            }
        }
        List<Incident> results = incidentRepo.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
        return results.stream()
                .filter(incident -> privileged || isReadableBy(incident, username))
                .map(this::mapToSearchDoc)
                .toList();
    }

    private boolean isReadableBy(Incident incident, String username) {
        return username != null && (username.equals(incident.getReportedBy()) || username.equals(incident.getAssignedTo()));
    }

    public Map<String, Object> getStats(String username, boolean privileged) {
        List<Incident> incidents = privileged
                ? incidentRepo.findAll()
                : incidentRepo.findByAssignedToOrReportedBy(username, username);

        long total = incidents.size();
        long open = countByStatus(incidents, "OPEN");
        long investigating = countByStatus(incidents, "INVESTIGATING");
        long waitingEvidence = countByStatus(incidents, "WAITING_EVIDENCE");
        long resolved = countByStatus(incidents, "RESOLVED");
        long closed = countByStatus(incidents, "CLOSED");
        long critical = countBySeverity(incidents, "CRITICAL");
        long high = countBySeverity(incidents, "HIGH");
        long medium = countBySeverity(incidents, "MEDIUM");
        long low = countBySeverity(incidents, "LOW");
        double averageRiskScore = incidents.stream()
                .mapToInt(Incident::getRiskScore)
                .average()
                .orElse(0.0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("open", open);
        stats.put("investigating", investigating);
        stats.put("waiting_evidence", waitingEvidence);
        stats.put("resolved", resolved);
        stats.put("closed", closed);
        stats.put("critical", critical);
        stats.put("high", high);
        stats.put("medium", medium);
        stats.put("low", low);
        stats.put("averageRiskScore", averageRiskScore);
        return stats;
    }

    private long countByStatus(List<Incident> incidents, String status) {
        return incidents.stream().filter(i -> status.equals(i.getStatus())).count();
    }

    private long countBySeverity(List<Incident> incidents, String severity) {
        return incidents.stream().filter(i -> severity.equals(i.getSeverity())).count();
    }

    public Incident assignAnalyst(String id, String analystUsername, String analystName, String updatedBy) {
        Incident incident = findById(id);
        String prevAnalyst = incident.getAssignedTo();
        incident.setAssignedTo(analystUsername);
        incident.setAssignedToName(analystName);
        incident.setUpdatedAt(LocalDateTime.now());

        Incident saved = incidentRepo.save(incident);
        indexToElasticsearch(saved);

        auditLogService.logEvent(id, updatedBy, updatedBy, "ASSIGNED",
                "Incident assigned to " + (analystName != null ? analystName : analystUsername), null);

        if (analystUsername != null && !analystUsername.equals(prevAnalyst)) {
            notificationService.sendNotification(
                    analystUsername,
                    "INCIDENT_ASSIGNED",
                    "Assigned: " + incident.getTitle(),
                    "Incident assigned to you by " + updatedBy + " with severity " + incident.getSeverity(),
                    id
            );
        }

        return saved;
    }

    public Incident updateStatus(String id, String status) {
        return updateStatus(id, status, "system");
    }

    public Incident updateStatus(String id, String status, String updatedBy) {
        Incident incident = findById(id);
        String oldStatus = incident.getStatus();
        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());

        if ("RESOLVED".equals(status) || "CLOSED".equals(status)) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        Incident saved = incidentRepo.save(incident);
        indexToElasticsearch(saved);

        auditLogService.logEvent(id, updatedBy, updatedBy, "STATUS_UPDATED",
                "Status changed from " + oldStatus + " to " + status, null);

        if (incident.getReportedBy() != null) {
            notificationService.sendNotification(
                    incident.getReportedBy(),
                    "STATUS_UPDATE",
                    "Status Update: " + incident.getTitle(),
                    "Incident status updated to " + status,
                    id
            );
        }
        if (incident.getAssignedTo() != null && !incident.getAssignedTo().equals(incident.getReportedBy())) {
            notificationService.sendNotification(
                    incident.getAssignedTo(),
                    "STATUS_UPDATE",
                    "Status Update: " + incident.getTitle(),
                    "Incident status updated to " + status,
                    id
            );
        }

        return saved;
    }

    public List<Incident> getRelatedIncidents(String incidentId) {
        Incident current = findById(incidentId);
        return findRelatedIncidents(current, incidentRepo.findAll());
    }

    public List<Incident> getRelatedIncidents(String incidentId, String username, boolean privileged) {
        Incident current = findById(incidentId, username, privileged);
        return findRelatedIncidents(current, getAll(username, privileged));
    }

    private List<Incident> findRelatedIncidents(Incident current, List<Incident> candidates) {
        return candidates.stream()
                .filter(i -> !i.getId().equals(current.getId()))
                .filter(i -> (current.getCategory() != null && current.getCategory().equalsIgnoreCase(i.getCategory())) ||
                             (current.getSeverity() != null && current.getSeverity().equalsIgnoreCase(i.getSeverity())) ||
                             (current.getLocation() != null && current.getLocation().equalsIgnoreCase(i.getLocation())))
                .limit(4)
                .toList();
    }

    public Incident toggleChecklistItem(String incidentId, String itemId, String username) {
        Incident incident = findById(incidentId);
        incident.setUpdatedAt(LocalDateTime.now());
        auditLogService.logEvent(incidentId, username, username, "CHECKLIST_UPDATED",
                "Toggled checklist item " + itemId + " on incident " + incidentId, null);
        return incidentRepo.save(incident);
    }

    public Incident updateIncident(String id, Incident updated) {
        return updateIncident(id, updated, "system");
    }

    public Incident updateIncident(String id, Incident updated, String updatedBy) {
        Incident existing = findById(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setLocation(updated.getLocation());
        existing.setSeverity(updated.getSeverity());
        existing.setCategory(updated.getCategory());
        existing.setPriority(updated.getPriority() != null ? updated.getPriority() : calculatePriority(updated));
        existing.setRiskScore(calculateRiskScore(existing));
        existing.setDepartment(updated.getDepartment());
        existing.setTags(updated.getTags());
        existing.setRelatedIncidentIds(updated.getRelatedIncidentIds());
        existing.setWatchers(updated.getWatchers());
        existing.setUpdatedAt(LocalDateTime.now());

        Incident saved = incidentRepo.save(existing);
        indexToElasticsearch(saved);

        auditLogService.logEvent(id, updatedBy, updatedBy, "INCIDENT_UPDATED",
                "Incident updated by " + updatedBy, null);

        return saved;
    }

    public void delete(String id, String deletedBy) {
        Incident incident = findById(id);
        auditLogService.logEvent(id, deletedBy, deletedBy, "INCIDENT_DELETED",
                "Incident deleted by " + deletedBy + ": " + incident.getTitle(), null);
        incidentRepo.deleteById(id);
        if (searchRepo != null) {
            try {
                searchRepo.deleteById(id);
            } catch (Exception e) {
                log.warn("Failed to delete incident from Elasticsearch: {}", e.getMessage());
            }
        }
    }

    public int calculateRiskScore(Incident incident) {
        int score = 0;
        if (incident.getSeverity() != null) {
            switch (incident.getSeverity().toUpperCase()) {
                case "CRITICAL" -> score += 50;
                case "HIGH" -> score += 35;
                case "MEDIUM" -> score += 20;
                case "LOW" -> score += 10;
            }
        }
        if (incident.getCategory() != null) {
            switch (incident.getCategory().toUpperCase()) {
                case "WORKPLACE_VIOLENCE" -> score += 30;
                case "CYBER_THREAT", "DATA_BREACH" -> score += 25;
                case "THREAT" -> score += 20;
                case "SUSPICIOUS_ACTIVITY", "PHYSICAL_SECURITY" -> score += 15;
            }
        }
        return Math.min(score, 100);
    }

    public String calculatePriority(Incident incident) {
        String severity = incident.getSeverity() != null ? incident.getSeverity().toUpperCase() : "LOW";
        int risk = incident.getRiskScore();

        if ("CRITICAL".equals(severity) || risk >= 70) {
            return "P1";
        } else if ("HIGH".equals(severity) || risk >= 50) {
            return "P2";
        } else if ("MEDIUM".equals(severity) || risk >= 30) {
            return "P3";
        } else {
            return "P4";
        }
    }

    private void indexToElasticsearch(Incident incident) {
        if (searchRepo != null) {
            try {
                IncidentSearchDoc doc = mapToSearchDoc(incident);
                searchRepo.save(doc);
            } catch (Exception e) {
                log.warn("Failed to index incident {} to Elasticsearch: {}", incident.getId(), e.getMessage());
            }
        }
    }

    private IncidentSearchDoc mapToSearchDoc(Incident i) {
        IncidentSearchDoc doc = new IncidentSearchDoc();
        doc.setId(i.getId());
        doc.setTitle(i.getTitle());
        doc.setDescription(i.getDescription());
        doc.setSeverity(i.getSeverity());
        doc.setCategory(i.getCategory());
        doc.setStatus(i.getStatus());
        doc.setCreatedAt(i.getCreatedAt());
        return doc;
    }
}
