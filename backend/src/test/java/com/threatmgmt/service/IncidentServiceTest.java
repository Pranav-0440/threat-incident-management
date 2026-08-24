package com.threatmgmt.service;

import com.threatmgmt.model.Incident;
import com.threatmgmt.model.IncidentSearchDoc;
import com.threatmgmt.repository.IncidentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepo;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private IncidentCollaborationPublisher collaborationPublisher;

    @InjectMocks
    private IncidentService incidentService;

    @Test
    void calculateRiskScore_criticalWorkplaceViolence_returns80() {
        Incident incident = Incident.builder()
                .severity("CRITICAL")
                .category("WORKPLACE_VIOLENCE")
                .build();

        int score = incidentService.calculateRiskScore(incident);
        assertEquals(80, score);
    }

    @Test
    void calculateRiskScore_highThreat_returns55() {
        Incident incident = Incident.builder()
                .severity("HIGH")
                .category("THREAT")
                .build();

        int score = incidentService.calculateRiskScore(incident);
        assertEquals(55, score);
    }

    @Test
    void calculateRiskScore_mediumSuspiciousActivity_returns35() {
        Incident incident = Incident.builder()
                .severity("MEDIUM")
                .category("SUSPICIOUS_ACTIVITY")
                .build();

        int score = incidentService.calculateRiskScore(incident);
        assertEquals(35, score);
    }

    @Test
    void calculateRiskScore_lowNoCategory_returns10() {
        Incident incident = Incident.builder()
                .severity("LOW")
                .build();

        int score = incidentService.calculateRiskScore(incident);
        assertEquals(10, score);
    }

    @Test
    void calculateRiskScore_cappedAt100() {
        Incident incident = Incident.builder()
                .severity("CRITICAL")
                .category("WORKPLACE_VIOLENCE")
                .build();

        int score = incidentService.calculateRiskScore(incident);
        assertTrue(score <= 100);
    }

    @Test
    void createIncident_setsStatusAndRiskScore() {
        Incident incident = Incident.builder()
                .title("Test Incident")
                .description("Test description")
                .severity("HIGH")
                .category("THREAT")
                .build();

        when(incidentRepo.save(any(Incident.class))).thenAnswer(i -> {
            Incident saved = i.getArgument(0);
            saved.setId("generated-id");
            return saved;
        });

        Incident result = incidentService.createIncident(incident);

        assertEquals("OPEN", result.getStatus());
        assertEquals(55, result.getRiskScore());
        assertNotNull(result.getCreatedAt());
        verify(incidentRepo, times(1)).save(any());
    }

    @Test
    void updateStatus_updatesAndSaves() {
        Incident existing = Incident.builder()
                .id("test-id")
                .title("Test")
                .description("Test")
                .status("OPEN")
                .severity("HIGH")
                .build();

        when(incidentRepo.findById("test-id")).thenReturn(Optional.of(existing));
        when(incidentRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        Incident result = incidentService.updateStatus("test-id", "INVESTIGATING");

        assertEquals("INVESTIGATING", result.getStatus());
        assertNotNull(result.getUpdatedAt());
        verify(collaborationPublisher).publishStatusChanged(result, "OPEN", "system");
    }

    @Test
    void getStats_forAnalyst_scopesToAssignedOrReportedIncidents() {
        Incident assigned = Incident.builder()
                .status("OPEN")
                .severity("HIGH")
                .riskScore(60)
                .assignedTo("analystA")
                .build();
        Incident reported = Incident.builder()
                .status("RESOLVED")
                .severity("LOW")
                .riskScore(20)
                .reportedBy("analystA")
                .build();

        when(incidentRepo.findByAssignedToOrReportedBy("analystA", "analystA"))
                .thenReturn(List.of(assigned, reported));

        Map<String, Object> stats = incidentService.getStats("analystA", false);

        assertEquals(2L, stats.get("total"));
        assertEquals(1L, stats.get("open"));
        assertEquals(1L, stats.get("resolved"));
        assertEquals(1L, stats.get("high"));
        assertEquals(1L, stats.get("low"));
        assertEquals(40.0, stats.get("averageRiskScore"));
        verify(incidentRepo).findByAssignedToOrReportedBy("analystA", "analystA");
        verify(incidentRepo, never()).findAll();
    }

    @Test
    void getStats_forPrivilegedUser_usesGlobalIncidentsAndIncludesAllMetrics() {
        Incident openCritical = Incident.builder()
                .status("OPEN")
                .severity("CRITICAL")
                .riskScore(80)
                .build();
        Incident waitingClosed = Incident.builder()
                .status("WAITING_EVIDENCE")
                .severity("MEDIUM")
                .riskScore(35)
                .build();
        Incident closedLow = Incident.builder()
                .status("CLOSED")
                .severity("LOW")
                .riskScore(10)
                .build();
        when(incidentRepo.findAll()).thenReturn(List.of(openCritical, waitingClosed, closedLow));

        Map<String, Object> stats = incidentService.getStats("admin", true);

        assertEquals(3L, stats.get("total"));
        assertEquals(1L, stats.get("open"));
        assertEquals(1L, stats.get("waiting_evidence"));
        assertEquals(1L, stats.get("closed"));
        assertEquals(1L, stats.get("critical"));
        assertEquals(1L, stats.get("medium"));
        assertEquals(1L, stats.get("low"));
        assertEquals(125.0 / 3.0, (Double) stats.get("averageRiskScore"), 0.0001);
        verify(incidentRepo).findAll();
        verify(incidentRepo, never()).findByAssignedToOrReportedBy(any(), any());
    }

    @Test
    void getStats_forEmptyScope_returnsZeroAverage() {
        when(incidentRepo.findByAssignedToOrReportedBy("analystA", "analystA"))
                .thenReturn(List.of());

        Map<String, Object> stats = incidentService.getStats("analystA", false);

        assertEquals(0L, stats.get("total"));
        assertEquals(0.0, stats.get("averageRiskScore"));
    }

    @Test
    void searchIncidents_success() {
        Incident incident = Incident.builder()
                .id("1")
                .title("Phishing Threat")
                .description("Suspicious email received")
                .build();

        when(incidentRepo.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase("Phishing", "Phishing"))
                .thenReturn(List.of(incident));

        List<IncidentSearchDoc> results = incidentService.searchIncidents("Phishing");

        assertEquals(1, results.size());
        assertEquals("Phishing Threat", results.get(0).getTitle());
        verify(incidentRepo, times(1)).findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(any(), any());
    }
}
