package com.threatmgmt.controller;

import com.threatmgmt.config.CorsConfig;
import com.threatmgmt.config.PasswordConfig;
import com.threatmgmt.config.SecurityConfig;
import com.threatmgmt.filter.CorrelationIdFilter;
import com.threatmgmt.security.IncidentPermissionEvaluator;
import com.threatmgmt.security.JwtFilter;
import com.threatmgmt.security.JwtUtil;
import com.threatmgmt.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HealthController.class)
@Import({SecurityConfig.class, PasswordConfig.class, CorsConfig.class, JwtFilter.class, CorrelationIdFilter.class})
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserService userService;

    @MockBean
    private IncidentPermissionEvaluator incidentPermissionEvaluator;

    @Test
    void healthIsPublicAndReportsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp", not(emptyOrNullString())))
                .andExpect(header().string("X-Correlation-ID", matchesPattern("[A-Za-z0-9._:-]{1,128}")));
    }

    @Test
    void readinessIsPublicAndReportsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp", not(emptyOrNullString())));
    }
}
