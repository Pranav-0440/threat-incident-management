package com.threatmgmt.service;

import com.threatmgmt.model.Incident;
import com.threatmgmt.repository.IncidentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidentPaginationServiceTest {

    @Mock
    private IncidentRepository incidentRepo;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private IncidentService incidentService;

    @Test
    void pageRequestIsBoundedNormalizedAndStablySorted() {
        when(incidentRepo.findPage(
                eq("analyst"), eq(false), eq("phishing"), eq("HIGH"), eq("OPEN"),
                isNull(), isNull(), any(Pageable.class)))
                .thenReturn(Page.empty());

        Page<Incident> result = incidentService.getPage(
                "analyst", false, -4, 500, "  phishing  ", " high ", " open ",
                null, null, "unsupported", "invalid");

        assertEquals(0, result.getNumber());
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(incidentRepo).findPage(
                eq("analyst"), eq(false), eq("phishing"), eq("HIGH"), eq("OPEN"),
                isNull(), isNull(), pageable.capture());
        assertEquals(0, pageable.getValue().getPageNumber());
        assertEquals(100, pageable.getValue().getPageSize());
        assertEquals("createdAt: DESC,id: DESC", pageable.getValue().getSort().toString());
    }
}
