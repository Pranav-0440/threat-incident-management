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
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

    @MockBean
    private DataSource dataSource;

    @MockBean
    private RedisConnectionFactory redisConnectionFactory;

    @Test
    void healthIsPublicAndReportsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp", not(emptyOrNullString())))
                .andExpect(header().string("X-Correlation-ID", matchesPattern("[A-Za-z0-9._:-]{1,128}")));
    }

    @Test
    void livenessIsPublicAndReportsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.timestamp", not(emptyOrNullString())));
    }

    @Test
    void readiness_whenDatabaseAndRedisHealthy_reportsUp200() throws Exception {
        Connection conn = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(conn);
        when(conn.isValid(2)).thenReturn(true);

        RedisConnection redisConn = mock(RedisConnection.class);
        when(redisConnectionFactory.getConnection()).thenReturn(redisConn);
        when(redisConn.ping()).thenReturn("PONG");

        mockMvc.perform(get("/api/v1/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components.database.status").value("UP"))
                .andExpect(jsonPath("$.components.redis.status").value("UP"));
    }

    @Test
    void readiness_whenDatabaseFails_reportsDown503() throws Exception {
        when(dataSource.getConnection()).thenThrow(new SQLException("Connection pool timeout"));

        mockMvc.perform(get("/api/v1/health/readiness"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.components.database.status").value("DOWN"))
                .andExpect(jsonPath("$.components.database.error", containsString("Connection pool timeout")));
    }

    @Test
    void readiness_whenRedisFails_reportsUpWithDegradedRedis() throws Exception {
        Connection conn = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(conn);
        when(conn.isValid(2)).thenReturn(true);

        when(redisConnectionFactory.getConnection()).thenThrow(new RuntimeException("Redis cluster unreachable"));

        mockMvc.perform(get("/api/v1/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components.database.status").value("UP"))
                .andExpect(jsonPath("$.components.redis.status").value("DOWN"));
    }
}
