package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Incident;
import com.threatmgmt.model.Incident.ChecklistItem;
import com.threatmgmt.model.IncidentSearchDoc;
import com.threatmgmt.repository.IncidentRepository;
import com.threatmgmt.repository.IncidentSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private final IncidentRepository incidentRepo;
    private final IncidentSearchRepository searchRepo;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

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

        // Default SOC Investigation Checklist
        if (incident.getChecklist() == null || incident.getChecklist().isEmpty()) {
            incident.setChecklist(createDefaultChecklist());
        }

        Incident saved = incidentRepo.save(incident);
        log.info("Created incident: {} with risk score: {} and priority: {}", saved.getId(), saved.getRiskScore(), saved.getPriority());

        auditLogService.logEvent(saved.getId(), incident.getReportedBy(), incident.getReportedBy(), "INCIDENT_CREATED",
                "Incident reported by " + incident.getReportedBy() + ": " + saved.getTitle(), null);

        try {
            IncidentSearchDoc doc = mapToSearchDoc(saved);
            searchRepo.save(doc);
        } catch (Exception e) {
            log.warn("Failed to index incident {} in Elasticsearch: {}", saved.getId(), e.getMessage());
        }

        return saved;
    }

    public List<Incident> getAll() {
        return incidentRepo.findAll();
    }

    public Incident findById(String id) {
        return incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));
    }

    public List<Incident> findBySeverity(String severity) {
        return incidentRepo.findBySeverity(severity);
    }

    public List<Incident> findByStatus(String status) {
        return incidentRepo.findByStatus(status);
    }

    public List<IncidentSearchDoc> searchIncidents(String query) {
        try {
            return searchRepo.findByTitleContainingOrDescriptionContaining(query, query);
        } catch (Exception e) {
            log.warn("Elasticsearch search failed, falling back to MongoDB search: {}", e.getMessage());
            List<Incident> fallbackResults = incidentRepo.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
            return fallbackResults.stream()
                    .map(this::mapToSearchDoc)
                    .toList();
        }
    }

    public Incident assignAnalyst(String id, String analystUsername, String analystName, String updatedBy) {
        Incident incident = findById(id);
        
        // IDOR Fix: Verify assignment rights
        boolean isAdmin = updatedBy.equals("system"); 
        if (!isAdmin && !updatedBy.equals(incident.getReportedBy()) && (incident.getAssignedTo() != null && !updatedBy.equals(incident.getAssignedTo()))) {
            throw new org.springframework.security.access.AccessDeniedException("Permission denied.");
        }
        
        String prevAnalyst = incident.getAssignedTo();
        incident.setAssignedTo(analystUsername);
        incident.setAssignedToName(analystName);
        incident.setUpdatedAt(LocalDateTime.now());

        Incident saved = incidentRepo.save(incident);

        auditLogService.logEvent(id, updatedBy, updatedBy, "ASSIGNED",
                "Incident assigned to " + (analystName != null ? analystName : analystUsername),
                Map.of("previousAssignedTo", prevAnalyst != null ? prevAnalyst : "Unassigned", "newAssignedTo", analystUsername));

        if (analystUsername != null && !analystUsername.isEmpty()) {
            notificationService.createNotification(
                    analystUsername,
                    "New Incident Assignment",
                    "You have been assigned to incident: " + incident.getTitle(),
                    "INCIDENT_ASSIGNED",
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

        Incident saved = incidentRepo.save(incident);

        auditLogService.logEvent(id, updatedBy, updatedBy, "STATUS_UPDATED",
                "Status updated from " + oldStatus + " to " + status,
                Map.of("oldStatus", oldStatus, "newStatus", status));

        if (incident.getAssignedTo() != null && !incident.getAssignedTo().equals(updatedBy)) {
            notificationService.createNotification(
                    incident.getAssignedTo(),
                    "Incident Status Updated",
                    "Status for incident '" + incident.getTitle() + "' changed to " + status,
                    "STATUS_CHANGED",
                    id
            );
        }

        try {
            searchRepo.save(mapToSearchDoc(saved));
        } catch (Exception e) {
            log.warn("Failed to sync status update to Elasticsearch: {}", e.getMessage());
        }

        return saved;
    }

    public Incident toggleChecklistItem(String incidentId, String itemId, String username) {
        Incident incident = findById(incidentId);
        if (incident.getChecklist() != null) {
            for (ChecklistItem item : incident.getChecklist()) {
                if (item.getId().equals(itemId)) {
                    boolean newStatus = !item.isCompleted();
                    item.setCompleted(newStatus);
                    item.setCompletedBy(newStatus ? username : null);
                    item.setCompletedAt(newStatus ? LocalDateTime.now() : null);

                    auditLogService.logEvent(incidentId, username, username, "CHECKLIST_UPDATED",
                            (newStatus ? "Completed" : "Reopened") + " checklist item: " + item.getTitle(), null);
                    break;
                }
            }
        }
        incident.setUpdatedAt(LocalDateTime.now());
        return incidentRepo.save(incident);
    }

    public List<Incident> getRelatedIncidents(String incidentId) {
        Incident current = findById(incidentId);
        List<Incident> all = incidentRepo.findAll();
        return all.stream()
                .filter(i -> !i.getId().equals(incidentId))
                .filter(i -> (current.getCategory() != null && current.getCategory().equalsIgnoreCase(i.getCategory())) ||
                             (current.getSeverity() != null && current.getSeverity().equalsIgnoreCase(i.getSeverity())) ||
                             (current.getLocation() != null && current.getLocation().equalsIgnoreCase(i.getLocation())))
                .limit(4)
                .toList();
    }

    public Incident updateIncident(String id, Incident updated) {
        return updateIncident(id, updated, "system");
    }

    public Incident updateIncident(String id, Incident updated, String updatedBy) {
        Incident existing = findById(id);
        
        // IDOR Fix: Verify ownership
        boolean isAdmin = updatedBy.equals("system");
        if (!isAdmin && !updatedBy.equals(existing.getReportedBy()) && !updatedBy.equals(existing.getAssignedTo())) {
            throw new org.springframework.security.access.AccessDeniedException("Permission denied.");
        }
        
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setLocation(updated.getLocation());
        existing.setSeverity(updated.getSeverity());
        existing.setCategory(updated.getCategory());
        existing.setPriority(updated.getPriority() != null ? updated.getPriority() : calculatePriority(updated));
        existing.setRiskScore(calculateRiskScore(existing));
        existing.setUpdatedAt(LocalDateTime.now());

        Incident saved = incidentRepo.save(existing);

        auditLogService.logEvent(id, updatedBy, updatedBy, "INCIDENT_UPDATED",
                "Incident details updated by " + updatedBy, null);

        try {
            searchRepo.save(mapToSearchDoc(saved));
        } catch (Exception e) {
            log.warn("Failed to sync update to Elasticsearch: {}", e.getMessage());
        }

        return saved;
    }

    public void delete(String id) {
        delete(id, "system");
    }

    public void delete(String id, String deletedBy) {
        Incident incident = findById(id);

        auditLogService.logEvent(id, deletedBy, deletedBy, "INCIDENT_DELETED",
                "Incident deleted: " + incident.getTitle(), null);

        incidentRepo.delete(incident);

        try {
            searchRepo.deleteById(id);
        } catch (Exception e) {
            log.warn("Failed to delete incident {} from Elasticsearch: {}", id, e.getMessage());
        }

        log.info("Deleted incident: {}", id);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", incidentRepo.count());
        stats.put("open", incidentRepo.countByStatus("OPEN"));
        stats.put("investigating", incidentRepo.countByStatus("INVESTIGATING"));
        stats.put("waiting_evidence", incidentRepo.countByStatus("WAITING_EVIDENCE"));
        stats.put("resolved", incidentRepo.countByStatus("RESOLVED"));
        stats.put("closed", incidentRepo.countByStatus("CLOSED"));
        stats.put("critical", incidentRepo.countBySeverity("CRITICAL"));
        stats.put("high", incidentRepo.countBySeverity("HIGH"));
        stats.put("medium", incidentRepo.countBySeverity("MEDIUM"));
        stats.put("low", incidentRepo.countBySeverity("LOW"));

        List<Incident> all = incidentRepo.findAll();
        double avgRisk = all.stream()
                .mapToInt(Incident::getRiskScore)
                .average()
                .orElse(0.0);
        stats.put("averageRiskScore", Math.round(avgRisk));

        return stats;
    }

    public int calculateRiskScore(Incident incident) {
        int score = 0;

        if ("CRITICAL".equalsIgnoreCase(incident.getSeverity())) score += 50;
        else if ("HIGH".equalsIgnoreCase(incident.getSeverity())) score += 35;
        else if ("MEDIUM".equalsIgnoreCase(incident.getSeverity())) score += 20;
        else if ("LOW".equalsIgnoreCase(incident.getSeverity())) score += 10;

        if ("WORKPLACE_VIOLENCE".equalsIgnoreCase(incident.getCategory())) score += 30;
        else if ("THREAT".equalsIgnoreCase(incident.getCategory())) score += 20;
        else if ("SUSPICIOUS_ACTIVITY".equalsIgnoreCase(incident.getCategory())) score += 15;
        else if ("CYBER_THREAT".equalsIgnoreCase(incident.getCategory())) score += 25;
        else if ("PHYSICAL_SECURITY".equalsIgnoreCase(incident.getCategory())) score += 15;

        return Math.min(score, 100);
    }

    public String calculatePriority(Incident incident) {
        int score = incident.getRiskScore();
        if ("CRITICAL".equalsIgnoreCase(incident.getSeverity()) || score >= 70) return "P1";
        if ("HIGH".equalsIgnoreCase(incident.getSeverity()) || score >= 50) return "P2";
        if ("MEDIUM".equalsIgnoreCase(incident.getSeverity()) || score >= 30) return "P3";
        return "P4";
    }

    private List<ChecklistItem> createDefaultChecklist() {
        return List.of(
                ChecklistItem.builder().id("1").title("Photos & CCTV Footage Uploaded").completed(false).build(),
                ChecklistItem.builder().id("2").title("Network & Firewall Logs Collected").completed(false).build(),
                ChecklistItem.builder().id("3").title("Witness Interview Conducted").completed(false).build(),
                ChecklistItem.builder().id("4").title("Access Badge / Account Temporarily Disabled").completed(false).build(),
                ChecklistItem.builder().id("5").title("Police / Security Escalation Notified").completed(false).build(),
                ChecklistItem.builder().id("6").title("Management Incident Report Approved").completed(false).build()
        );
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
