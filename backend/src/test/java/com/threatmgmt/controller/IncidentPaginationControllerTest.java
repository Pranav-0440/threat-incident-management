package com.threatmgmt.controller;

import com.threatmgmt.config.PasswordConfig;
import com.threatmgmt.config.SecurityConfig;
import com.threatmgmt.model.Incident;
import com.threatmgmt.security.IncidentPermissionEvaluator;
import com.threatmgmt.security.JwtFilter;
import com.threatmgmt.security.JwtUtil;
import com.threatmgmt.service.IncidentService;
import com.threatmgmt.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IncidentController.class)
@Import({SecurityConfig.class, JwtFilter.class, PasswordConfig.class})
class IncidentPaginationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IncidentService incidentService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserService userService;

    @MockBean
    private IncidentPermissionEvaluator incidentPermissionEvaluator;

    @Test
    @WithMockUser(username = "analyst", roles = "ANALYST")
    void pageEndpointReturnsMetadataAndForwardsFilters() throws Exception {
        Incident incident = Incident.builder()
                .id("incident-1")
                .title("Phishing attempt")
                .severity("HIGH")
                .status("OPEN")
                .build();
        PageRequest request = PageRequest.of(1, 5,
                Sort.by(Sort.Direction.DESC, "createdAt")
                        .and(Sort.by(Sort.Direction.DESC, "id")));
        when(incidentService.getPage(
                eq("analyst"), eq(false), eq(1), eq(5), eq("phishing"), eq("high"),
                eq("open"), isNull(), isNull(), eq("createdAt"), eq("desc")))
                .thenReturn(new PageImpl<>(List.of(incident), request, 6));

        mockMvc.perform(get("/api/v1/incidents/page")
                        .param("page", "1")
                        .param("size", "5")
                        .param("q", "phishing")
                        .param("severity", "high")
                        .param("status", "open")
                        .param("sortBy", "createdAt")
                        .param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].id").value("incident-1"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.first").value(false))
                .andExpect(jsonPath("$.last").value(true));

        verify(incidentService).getPage(
                "analyst", false, 1, 5, "phishing", "high", "open", null, null,
                "createdAt", "desc");
    }
}
