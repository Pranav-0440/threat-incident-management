package com.threatmgmt.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threatmgmt.model.Incident;
import com.threatmgmt.model.IncidentSearchDoc;
import com.threatmgmt.security.IncidentPermissionEvaluator;
import com.threatmgmt.security.JwtUtil;
import com.threatmgmt.service.IncidentService;
import com.threatmgmt.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import com.threatmgmt.config.SecurityConfig;
import com.threatmgmt.config.PasswordConfig;
import com.threatmgmt.security.JwtFilter;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IncidentController.class)
@Import({SecurityConfig.class, JwtFilter.class, PasswordConfig.class})
class IncidentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IncidentService incidentService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserService userService;

    @MockBean
    private IncidentPermissionEvaluator incidentPermissionEvaluator;   // NEW — required by SecurityConfig

    @Autowired
    private ObjectMapper objectMapper;


    @Test
    @WithMockUser(roles = "ANALYST")
    void createIncident_returnsCreated() throws Exception {
        Incident incident = Incident.builder()
                .id("test-id-1")
                .title("Suspicious person at Gate 3")
                .description("Unidentified individual loitering near restricted area")
                .severity("HIGH")
                .category("SUSPICIOUS_ACTIVITY")
                .status("OPEN")
                .riskScore(50)
                .createdAt(LocalDateTime.now())
                .build();

        when(incidentService.createIncident(any())).thenReturn(incident);

        mockMvc.perform(post("/api/v1/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(incident)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.severity").value("HIGH"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.riskScore").value(50));
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    void getAll_returnsList() throws Exception {
        Incident incident1 = Incident.builder()
                .id("1").title("Incident 1").description("Test 1")
                .severity("LOW").status("OPEN").build();
        Incident incident2 = Incident.builder()
                .id("2").title("Incident 2").description("Test 2")
                .severity("HIGH").status("INVESTIGATING").build();

        when(incidentService.getAll()).thenReturn(List.of(incident1, incident2));

        mockMvc.perform(get("/api/v1/incidents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @WithMockUser(username = "analystA", roles = "ANALYST")
    void filter_acceptsMultiSelectsAndDateRange() throws Exception {
        Incident incident = Incident.builder()
                .id("filtered-1").title("Door incident").description("Test")
                .severity("HIGH").status("OPEN").category("THREAT").priority("P1").build();
        when(incidentService.filterIncidents(
                eq("analystA"), eq(false), eq("door"),
                eq(List.of("HIGH", "CRITICAL")),
                eq(List.of("OPEN", "INVESTIGATING")),
                eq(List.of("THREAT")),
                eq(List.of("P1")),
                eq(LocalDate.of(2026, 1, 1)),
                eq(LocalDate.of(2026, 1, 31))))
                .thenReturn(List.of(incident));

        mockMvc.perform(get("/api/v1/incidents/filter")
                        .param("query", "door")
                        .param("severity", "HIGH", "CRITICAL")
                        .param("status", "OPEN", "INVESTIGATING")
                        .param("category", "THREAT")
                        .param("priority", "P1")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("filtered-1"));

        verify(incidentService).filterIncidents(
                eq("analystA"), eq(false), eq("door"),
                eq(List.of("HIGH", "CRITICAL")),
                eq(List.of("OPEN", "INVESTIGATING")),
                eq(List.of("THREAT")),
                eq(List.of("P1")),
                eq(LocalDate.of(2026, 1, 1)),
                eq(LocalDate.of(2026, 1, 31)));
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    void getById_returnsIncident() throws Exception {
        Incident incident = Incident.builder()
                .id("test-id-1")
                .title("Test Incident")
                .description("Test description")
                .severity("CRITICAL")
                .status("OPEN")
                .build();

        when(incidentService.findById("test-id-1")).thenReturn(incident);

        mockMvc.perform(get("/api/v1/incidents/test-id-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Incident"))
                .andExpect(jsonPath("$.severity").value("CRITICAL"));
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    void search_returnsResults() throws Exception {
        IncidentSearchDoc doc = new IncidentSearchDoc();
        doc.setId("1");
        doc.setTitle("Suspicious activity");
        doc.setDescription("Detected near building");

        when(incidentService.searchIncidents("suspicious")).thenReturn(List.of(doc));

        mockMvc.perform(get("/api/v1/incidents/search").param("q", "suspicious"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser(username = "analystA", roles = "ANALYST")
    void getStats_asAnalyst_usesScopedServiceCall() throws Exception {
        when(incidentService.getStats("analystA", false))
                .thenReturn(Map.of("total", 2L, "open", 1L));

        mockMvc.perform(get("/api/v1/incidents/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.open").value(1));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void getStats_asAdmin_usesPrivilegedServiceCall() throws Exception {
        when(incidentService.getStats("admin", true))
                .thenReturn(Map.of("total", 10L, "critical", 3L));

        mockMvc.perform(get("/api/v1/incidents/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(10))
                .andExpect(jsonPath("$.critical").value(3));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateStatus_asAdmin_succeeds() throws Exception {
        Incident incident = Incident.builder()
                .id("test-id-1")
                .title("Test").description("Test")
                .status("INVESTIGATING")
                .build();

        when(incidentPermissionEvaluator.hasPermission(any(), any(), anyString(), eq("status_update")))
                .thenReturn(true);
        when(incidentService.updateStatus(eq("test-id-1"), eq("INVESTIGATING"), any())).thenReturn(incident);

        mockMvc.perform(patch("/api/v1/incidents/test-id-1/status")
                        .param("status", "INVESTIGATING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INVESTIGATING"));
    }

    @Test
    @WithMockUser(username = "analystA", roles = "ANALYST")
    void updateStatus_asAssignedAnalyst_succeeds() throws Exception {
        Incident incident = Incident.builder()
                .id("test-id-1")
                .title("Test")
                .description("Test")
                .status("RESOLVED")
                .assignedTo("analystA")
                .build();

        when(incidentPermissionEvaluator.hasPermission(any(), eq("test-id-1"), eq("incident"), eq("status_update")))
                .thenReturn(true);
        when(incidentService.updateStatus(eq("test-id-1"), eq("RESOLVED"), eq("analystA")))
                .thenReturn(incident);

        mockMvc.perform(patch("/api/v1/incidents/test-id-1/status")
                        .param("status", "RESOLVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));
    }

    @Test
    @WithMockUser(username = "analystB", roles = "ANALYST")
    void updateStatus_asUnrelatedAnalyst_forbidden() throws Exception {
        when(incidentPermissionEvaluator.hasPermission(any(), eq("test-id-1"), eq("incident"), eq("status_update")))
                .thenReturn(false);

        mockMvc.perform(patch("/api/v1/incidents/test-id-1/status")
                        .param("status", "RESOLVED"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_asAdmin_succeeds() throws Exception {
        mockMvc.perform(delete("/api/v1/incidents/test-id-1"))
                .andExpect(status().isNoContent());
    }

    // ===== NEW — proves the #10 IDOR fix on PUT /{id} =====

    @Test
    @WithMockUser(username = "analystB", roles = "ANALYST")
    void update_asUnrelatedAnalyst_forbidden() throws Exception {
        when(incidentPermissionEvaluator.hasPermission(any(), any(), anyString(), any()))
                .thenReturn(false);

        Incident incident = Incident.builder()
                .id("test-id-1").title("Updated title").description("Updated desc")
                .status("OPEN").build();

        mockMvc.perform(put("/api/v1/incidents/test-id-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(incident)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "analystA", roles = "ANALYST")
    void update_asAssignedAnalyst_succeeds() throws Exception {
        when(incidentPermissionEvaluator.hasPermission(any(), any(), anyString(), any()))
                .thenReturn(true);

        Incident incident = Incident.builder()
                .id("test-id-1").title("Updated title").description("Updated desc")
                .status("OPEN").assignedTo("analystA").build();

        when(incidentService.updateIncident(eq("test-id-1"), any(), eq("analystA")))
                .thenReturn(incident);

        mockMvc.perform(put("/api/v1/incidents/test-id-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(incident)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated title"));
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void update_asAdmin_succeeds() throws Exception {
        when(incidentPermissionEvaluator.hasPermission(any(), any(), anyString(), any()))
                .thenReturn(true);

        Incident incident = Incident.builder()
                .id("test-id-1").title("Updated by admin").description("Updated desc")
                .status("OPEN").build();

        when(incidentService.updateIncident(eq("test-id-1"), any(), eq("admin1")))
                .thenReturn(incident);

        mockMvc.perform(put("/api/v1/incidents/test-id-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(incident)))
                .andExpect(status().isOk());
    }
}
