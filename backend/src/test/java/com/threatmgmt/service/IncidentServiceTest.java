package com.threatmgmt.service;

import com.threatmgmt.model.Incident;
import com.threatmgmt.model.IncidentSearchDoc;
import com.threatmgmt.repository.IncidentRepository;
import com.threatmgmt.repository.IncidentSearchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepo;

    @Mock
    private IncidentSearchRepository searchRepo;

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
        // Even if scores add up to more, it should cap at 100
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
        when(searchRepo.save(any(IncidentSearchDoc.class))).thenReturn(new IncidentSearchDoc());

        Incident result = incidentService.createIncident(incident);

        assertEquals("OPEN", result.getStatus());
        assertEquals(55, result.getRiskScore());
        assertNotNull(result.getCreatedAt());
        verify(incidentRepo, times(1)).save(any());
        verify(searchRepo, times(1)).save(any());
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
        when(searchRepo.save(any(IncidentSearchDoc.class))).thenReturn(new IncidentSearchDoc());

        Incident result = incidentService.updateStatus("test-id", "INVESTIGATING");

        assertEquals("INVESTIGATING", result.getStatus());
        assertNotNull(result.getUpdatedAt());
    }
}
