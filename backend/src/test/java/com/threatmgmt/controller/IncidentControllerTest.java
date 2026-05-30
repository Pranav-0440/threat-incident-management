package com.threatmgmt.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threatmgmt.model.Incident;
import com.threatmgmt.model.IncidentSearchDoc;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
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
    @WithMockUser(roles = "ADMIN")
    void updateStatus_asAdmin_succeeds() throws Exception {
        Incident incident = Incident.builder()
                .id("test-id-1")
                .title("Test").description("Test")
                .status("INVESTIGATING")
                .build();

        when(incidentService.updateStatus("test-id-1", "INVESTIGATING")).thenReturn(incident);

        mockMvc.perform(patch("/api/v1/incidents/test-id-1/status")
                        .param("status", "INVESTIGATING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INVESTIGATING"));
    }

    @Test
    @WithMockUser(roles = "ANALYST")
    void updateStatus_asAnalyst_forbidden() throws Exception {
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
}
