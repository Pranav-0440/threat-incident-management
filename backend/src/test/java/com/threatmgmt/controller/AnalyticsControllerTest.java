package com.threatmgmt.controller;

import com.threatmgmt.config.PasswordConfig;
import com.threatmgmt.config.SecurityConfig;
import com.threatmgmt.dto.AnalyticsStatsResponse;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IncidentController.class)
@Import({SecurityConfig.class, JwtFilter.class, PasswordConfig.class})
class AnalyticsControllerTest {

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
    @WithMockUser(username = "admin", roles = "ADMIN")
    void analyticsEndpointReturnsServerDerivedMetrics() throws Exception {
        AnalyticsStatsResponse response = new AnalyticsStatsResponse(
                2, 1, 0, 0, 1, 0, 1, 1, 0, 0,
                70.0, 1.5, 50.0, 1, "THREAT", 50.0,
                Map.of("THREAT", 1L, "DATA_BREACH", 1L),
                Map.of("Building A", 2L));
        when(incidentService.getAnalytics("admin", true)).thenReturn(response);

        mockMvc.perform(get("/api/v1/incidents/analytics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.averageResolutionHours").value(1.5))
                .andExpect(jsonPath("$.slaComplianceRate").value(50.0))
                .andExpect(jsonPath("$.overdueCount").value(1))
                .andExpect(jsonPath("$.topThreatVector").value("THREAT"))
                .andExpect(jsonPath("$.categoryCounts.THREAT").value(1));

        verify(incidentService).getAnalytics("admin", true);
    }
}
