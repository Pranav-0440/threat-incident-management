package com.threatmgmt.service;

import com.threatmgmt.model.ChecklistItem;
import com.threatmgmt.model.Incident;
import com.threatmgmt.model.IncidentSearchDoc;
import com.threatmgmt.repository.IncidentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
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
    void getAll_forAnalyst_usesOnlyAssignedOrReportedRecords() {
        Incident assigned = Incident.builder().id("assigned").assignedTo("analystA").build();
        Incident reported = Incident.builder().id("reported").reportedBy("analystA").build();
        when(incidentRepo.findByAssignedToOrReportedBy("analystA", "analystA"))
                .thenReturn(List.of(assigned, reported));

        List<Incident> results = incidentService.getAll("analystA", false);

        assertEquals(List.of(assigned, reported), results);
        verify(incidentRepo).findByAssignedToOrReportedBy("analystA", "analystA");
        verify(incidentRepo, never()).findAll();
    }

    @Test
    void findById_forUnrelatedAnalyst_returnsNotFound() {
        Incident incident = Incident.builder()
                .id("restricted")
                .reportedBy("reporter")
                .assignedTo("assignee")
                .build();
        when(incidentRepo.findById("restricted")).thenReturn(Optional.of(incident));

        assertThrows(com.threatmgmt.exception.ResourceNotFoundException.class,
                () -> incidentService.findById("restricted", "analystA", false));
    }

    @Test
    void searchIncidents_forAnalyst_filtersResultsByOwnership() {
        Incident visible = Incident.builder()
                .id("visible")
                .title("Visible threat")
                .reportedBy("analystA")
                .build();
        Incident hidden = Incident.builder()
                .id("hidden")
                .title("Hidden threat")
                .reportedBy("analystB")
                .build();
        when(incidentRepo.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase("threat", "threat"))
                .thenReturn(List.of(visible, hidden));

        List<IncidentSearchDoc> results = incidentService.searchIncidents("threat", "analystA", false);

        assertEquals(1, results.size());
        assertEquals("visible", results.get(0).getId());
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

    @Test
    void createIncident_initializesDefaultChecklistWhenNoneProvided() {
        Incident incident = Incident.builder()
                .title("Malware Outbreak")
                .description("Ransomware detected on finance server")
                .severity("CRITICAL")
                .reportedBy("soc_analyst")
                .build();

        when(incidentRepo.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Incident created = incidentService.createIncident(incident);

        assertNotNull(created.getChecklist());
        assertEquals(5, created.getChecklist().size());
        assertTrue(created.getChecklist().stream().noneMatch(ChecklistItem::isCompleted));
        assertTrue(created.getChecklist().stream().allMatch(item -> item.getId() != null && !item.getId().isEmpty()));
        verify(incidentRepo).save(any(Incident.class));
    }

    @Test
    void createIncident_preservesExplicitChecklist() {
        ChecklistItem customItem = ChecklistItem.builder()
                .id("custom-1")
                .title("Custom containment procedure")
                .completed(false)
                .build();
        Incident incident = Incident.builder()
                .title("DDoS Alert")
                .severity("HIGH")
                .reportedBy("soc_analyst")
                .checklist(new ArrayList<>(List.of(customItem)))
                .build();

        when(incidentRepo.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Incident created = incidentService.createIncident(incident);

        assertNotNull(created.getChecklist());
        assertEquals(1, created.getChecklist().size());
        assertEquals("custom-1", created.getChecklist().get(0).getId());
    }

    @Test
    void toggleChecklistItem_marksItemCompletedWithUserAndTimestamp() {
        ChecklistItem item1 = ChecklistItem.builder().id("item-1").title("Task 1").completed(false).build();
        ChecklistItem item2 = ChecklistItem.builder().id("item-2").title("Task 2").completed(false).build();
        Incident incident = Incident.builder()
                .id("inc-1")
                .title("Incident 1")
                .checklist(new ArrayList<>(List.of(item1, item2)))
                .build();

        when(incidentRepo.findById("inc-1")).thenReturn(Optional.of(incident));
        when(incidentRepo.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Incident updated = incidentService.toggleChecklistItem("inc-1", "item-1", "analystA");

        ChecklistItem toggled = updated.getChecklist().stream()
                .filter(i -> i.getId().equals("item-1"))
                .findFirst().orElseThrow();
        assertTrue(toggled.isCompleted());
        assertEquals("analystA", toggled.getCompletedBy());
        assertNotNull(toggled.getCompletedAt());
        verify(auditLogService).logEvent(eq("inc-1"), eq("analystA"), eq("analystA"), eq("CHECKLIST_UPDATED"), anyString(), isNull());
    }

    @Test
    void toggleChecklistItem_unchecksCompletedItem() {
        ChecklistItem item1 = ChecklistItem.builder()
                .id("item-1")
                .title("Task 1")
                .completed(true)
                .completedBy("analystA")
                .completedAt(java.time.LocalDateTime.now().minusHours(1))
                .build();
        Incident incident = Incident.builder()
                .id("inc-1")
                .title("Incident 1")
                .checklist(new ArrayList<>(List.of(item1)))
                .build();

        when(incidentRepo.findById("inc-1")).thenReturn(Optional.of(incident));
        when(incidentRepo.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Incident updated = incidentService.toggleChecklistItem("inc-1", "item-1", "analystA");

        ChecklistItem toggled = updated.getChecklist().get(0);
        assertFalse(toggled.isCompleted());
        assertNull(toggled.getCompletedBy());
        assertNull(toggled.getCompletedAt());
    }

    @Test
    void toggleChecklistItem_throwsIfItemNotFound() {
        ChecklistItem item1 = ChecklistItem.builder().id("item-1").title("Task 1").completed(false).build();
        Incident incident = Incident.builder()
                .id("inc-1")
                .checklist(new ArrayList<>(List.of(item1)))
                .build();

        when(incidentRepo.findById("inc-1")).thenReturn(Optional.of(incident));

        assertThrows(IllegalArgumentException.class,
                () -> incidentService.toggleChecklistItem("inc-1", "non-existent-item", "analystA"));
    }
}
