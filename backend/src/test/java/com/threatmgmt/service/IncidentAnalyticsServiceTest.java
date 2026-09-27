package com.threatmgmt.service;

import com.threatmgmt.dto.AnalyticsStatsResponse;
import com.threatmgmt.model.Incident;
import com.threatmgmt.repository.IncidentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidentAnalyticsServiceTest {

    @Mock
    private IncidentRepository incidentRepo;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private IncidentService incidentService;

    @Test
    void analyticsAreDerivedFromPersistedIncidentData() {
        LocalDateTime now = LocalDateTime.now();
        Incident resolved = Incident.builder()
                .id("resolved")
                .category("THREAT")
                .location("Building A")
                .status("RESOLVED")
                .priority("P1")
                .severity("CRITICAL")
                .riskScore(80)
                .createdAt(now.minusHours(2))
                .resolvedAt(now.minusHours(1))
                .build();
        Incident overdue = Incident.builder()
                .id("overdue")
                .category("THREAT")
                .location("Building B")
                .status("OPEN")
                .priority("P1")
                .severity("CRITICAL")
                .riskScore(75)
                .createdAt(now.minusHours(10))
                .build();
        when(incidentRepo.findByAssignedToOrReportedBy("analyst", "analyst"))
                .thenReturn(List.of(resolved, overdue));

        AnalyticsStatsResponse analytics = incidentService.getAnalytics("analyst", false);

        assertEquals(2, analytics.total());
        assertEquals(1, analytics.resolved());
        assertEquals(1.0, analytics.averageResolutionHours(), 0.1);
        assertEquals(50.0, analytics.slaComplianceRate(), 0.1);
        assertEquals(1, analytics.overdueCount());
        assertEquals("THREAT", analytics.topThreatVector());
        assertEquals(100.0, analytics.topThreatVectorPercent(), 0.1);
        assertEquals(2L, analytics.categoryCounts().get("THREAT"));
        assertEquals(1L, analytics.locationCounts().get("Building A"));
    }

    @Test
    void emptyAnalyticsHaveSafeZeroValues() {
        when(incidentRepo.findByAssignedToOrReportedBy("analyst", "analyst"))
                .thenReturn(List.of());

        AnalyticsStatsResponse analytics = incidentService.getAnalytics("analyst", false);

        assertEquals(0, analytics.total());
        assertEquals(0.0, analytics.averageResolutionHours());
        assertEquals(0.0, analytics.slaComplianceRate());
        assertEquals(0, analytics.overdueCount());
        assertEquals("NONE", analytics.topThreatVector());
        assertTrue(analytics.categoryCounts().isEmpty());
        assertTrue(analytics.locationCounts().isEmpty());
    }

    @Test
    void getAnalyticsExecutesSingleRepositoryQuery() {
        when(incidentRepo.findByAssignedToOrReportedBy("analyst", "analyst"))
                .thenReturn(List.of());

        incidentService.getAnalytics("analyst", false);

        verify(incidentRepo, times(1)).findByAssignedToOrReportedBy("analyst", "analyst");
    }

    @Test
    void getStatsComputesAccurateMetricsInSinglePass() {
        Incident i1 = Incident.builder()
                .id("1").status("OPEN").severity("HIGH").riskScore(50).build();
        Incident i2 = Incident.builder()
                .id("2").status("INVESTIGATING").severity("CRITICAL").riskScore(90).build();
        Incident i3 = Incident.builder()
                .id("3").status("RESOLVED").severity("LOW").riskScore(20).build();

        var stats = incidentService.getStats(List.of(i1, i2, i3));

        assertEquals(3L, stats.get("total"));
        assertEquals(1L, stats.get("open"));
        assertEquals(1L, stats.get("investigating"));
        assertEquals(1L, stats.get("resolved"));
        assertEquals(1L, stats.get("high"));
        assertEquals(1L, stats.get("critical"));
        assertEquals(1L, stats.get("low"));
        assertEquals(53.33, (Double) stats.get("averageRiskScore"), 0.1);
    }

    @Test
    void getRelatedIncidentsDelegatesToFindRelatedCandidates() {
        Incident current = Incident.builder()
                .id("inc-1")
                .category("CYBER_THREAT")
                .severity("HIGH")
                .location("DC-1")
                .build();
        Incident related = Incident.builder()
                .id("inc-2")
                .category("CYBER_THREAT")
                .severity("HIGH")
                .location("DC-1")
                .build();

        when(incidentRepo.findById("inc-1")).thenReturn(Optional.of(current));
        when(incidentRepo.findRelatedCandidates(
                eq("inc-1"),
                isNull(),
                eq(true),
                eq("CYBER_THREAT"),
                eq("HIGH"),
                eq("DC-1"),
                any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(List.of(related));

        List<Incident> results = incidentService.getRelatedIncidents("inc-1");

        assertEquals(1, results.size());
        assertEquals("inc-2", results.get(0).getId());
    }
}
