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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
}
