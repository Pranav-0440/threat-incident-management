package com.threatmgmt.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.threatmgmt.model.AuditLog;
import com.threatmgmt.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    private AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        auditLogService = new AuditLogService(auditLogRepository, objectMapper);
    }

    @Test
    void logEvent_serializesDetailsAsJson() throws Exception {
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AuditLog result = auditLogService.logEvent(
                "incident-1", "analystA", "Analyst A", "STATUS_UPDATED",
                "Status changed", Map.of("from", "OPEN", "to", "RESOLVED"));

        JsonNode details = objectMapper.readTree(result.getDetails());
        assertEquals("OPEN", details.get("from").asText());
        assertEquals("RESOLVED", details.get("to").asText());
    }

    @Test
    void auditLog_rejectsUpdatesAndDeletes() throws Exception {
        AuditLog auditLog = AuditLog.builder().build();

        assertThrows(UnsupportedOperationException.class,
                () -> invokeLifecycleCallback(auditLog, "rejectUpdate"));
        assertThrows(UnsupportedOperationException.class,
                () -> invokeLifecycleCallback(auditLog, "rejectDelete"));
    }

    private void invokeLifecycleCallback(AuditLog auditLog, String methodName) throws Exception {
        Method method = AuditLog.class.getDeclaredMethod(methodName);
        method.setAccessible(true);
        try {
            method.invoke(auditLog);
        } catch (InvocationTargetException exception) {
            if (exception.getCause() instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw exception;
        }
    }
}
