package com.threatmgmt.controller;

import com.threatmgmt.config.CorsConfig;
import com.threatmgmt.config.PasswordConfig;
import com.threatmgmt.config.SecurityConfig;
import com.threatmgmt.filter.CorrelationIdFilter;
import com.threatmgmt.model.AuditLog;
import com.threatmgmt.security.IncidentPermissionEvaluator;
import com.threatmgmt.security.JwtFilter;
import com.threatmgmt.security.JwtUtil;
import com.threatmgmt.service.AuditLogService;
import com.threatmgmt.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuditLogController.class)
@Import({SecurityConfig.class, PasswordConfig.class, CorsConfig.class, JwtFilter.class, CorrelationIdFilter.class})
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditLogService auditLogService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserService userService;

    @MockBean
    private IncidentPermissionEvaluator incidentPermissionEvaluator;

    @Test
    @WithMockUser(roles = "ANALYST")
    void getLogsForIncident_withReadPermission_returnsLogs() throws Exception {
        when(incidentPermissionEvaluator.hasPermission(any(), eq("inc-1"), eq("incident"), eq("read")))
                .thenReturn(true);
        AuditLog logEntry = AuditLog.builder()
                .id("log-1")
                .incidentId("inc-1")
                .action("INCIDENT_CREATED")
                .timestamp(LocalDateTime.now())
                .build();
        when(auditLogService.getLogsForIncident("inc-1")).thenReturn(List.of(logEntry));

        mockMvc.perform(get("/api/v1/audit-logs/incident/inc-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].action").value("INCIDENT_CREATED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllLogs_asAdmin_succeeds() throws Exception {
        AuditLog logEntry = AuditLog.builder().id("log-1").action("TEST").build();
        when(auditLogService.getAllLogs()).thenReturn(List.of(logEntry));

        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void getAllLogs_asSuperAdmin_succeeds() throws Exception {
        AuditLog logEntry = AuditLog.builder().id("log-1").action("TEST").build();
        when(auditLogService.getAllLogs()).thenReturn(List.of(logEntry));

        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    void getAllLogs_asAnalyst_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getPaginatedLogs_asAdmin_returnsPage() throws Exception {
        AuditLog logEntry = AuditLog.builder().id("log-1").action("TEST").build();
        when(auditLogService.getPaginatedLogs(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(logEntry)));

        mockMvc.perform(get("/api/v1/audit-logs/page")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void getPaginatedLogs_asSuperAdmin_returnsPage() throws Exception {
        AuditLog logEntry = AuditLog.builder().id("log-1").action("TEST").build();
        when(auditLogService.getPaginatedLogs(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(logEntry)));

        mockMvc.perform(get("/api/v1/audit-logs/page")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }
}
