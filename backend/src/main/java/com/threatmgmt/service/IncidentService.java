package com.threatmgmt.service;

import com.threatmgmt.exception.ResourceNotFoundException;
import com.threatmgmt.model.Incident;
import com.threatmgmt.model.IncidentSearchDoc;
import com.threatmgmt.repository.IncidentRepository;
import com.threatmgmt.repository.IncidentSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final IncidentSearchRepository searchRepo;

    public Incident createIncident(Incident incident) {
        incident.setCreatedAt(LocalDateTime.now());
        incident.setStatus("OPEN");
        incident.setRiskScore(calculateRiskScore(incident));

        Incident saved = incidentRepo.save(incident);
        log.info("Created incident: {} with risk score: {}", saved.getId(), saved.getRiskScore());

        // Sync to Elasticsearch
        try {
            IncidentSearchDoc doc = mapToSearchDoc(saved);
            searchRepo.save(doc);
            log.debug("Indexed incident {} in Elasticsearch", saved.getId());
        } catch (Exception e) {
            log.warn("Failed to index incident {} in Elasticsearch: {}",
                    saved.getId(), e.getMessage());
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
        return searchRepo.findByTitleContainingOrDescriptionContaining(query, query);
    }

    public Incident updateStatus(String id, String status) {
        Incident incident = findById(id);
        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());

        Incident saved = incidentRepo.save(incident);

        // Sync status update to Elasticsearch
        try {
            IncidentSearchDoc doc = mapToSearchDoc(saved);
            searchRepo.save(doc);
        } catch (Exception e) {
            log.warn("Failed to sync status update to Elasticsearch: {}", e.getMessage());
        }

        return saved;
    }

    public Incident updateIncident(String id, Incident updated) {
        Incident existing = findById(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setLocation(updated.getLocation());
        existing.setSeverity(updated.getSeverity());
        existing.setCategory(updated.getCategory());
        existing.setRiskScore(calculateRiskScore(existing));
        existing.setUpdatedAt(LocalDateTime.now());

        Incident saved = incidentRepo.save(existing);

        try {
            searchRepo.save(mapToSearchDoc(saved));
        } catch (Exception e) {
            log.warn("Failed to sync update to Elasticsearch: {}", e.getMessage());
        }

        return saved;
    }

    public void delete(String id) {
        Incident incident = findById(id);
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
        stats.put("resolved", incidentRepo.countByStatus("RESOLVED"));
        stats.put("critical", incidentRepo.countBySeverity("CRITICAL"));
        stats.put("high", incidentRepo.countBySeverity("HIGH"));
        stats.put("medium", incidentRepo.countBySeverity("MEDIUM"));
        stats.put("low", incidentRepo.countBySeverity("LOW"));

        // Calculate average risk score
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

        // Severity scoring
        if ("CRITICAL".equals(incident.getSeverity())) score += 50;
        else if ("HIGH".equals(incident.getSeverity())) score += 35;
        else if ("MEDIUM".equals(incident.getSeverity())) score += 20;
        else if ("LOW".equals(incident.getSeverity())) score += 10;

        // Category scoring
        if ("WORKPLACE_VIOLENCE".equals(incident.getCategory())) score += 30;
        else if ("THREAT".equals(incident.getCategory())) score += 20;
        else if ("SUSPICIOUS_ACTIVITY".equals(incident.getCategory())) score += 15;

        return Math.min(score, 100);
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
