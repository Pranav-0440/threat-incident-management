package com.threatmgmt.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.threatmgmt.model.AuditLog;
import com.threatmgmt.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLog logEvent(String incidentId, String actorUsername, String actorName, String action, String description, Map<String, Object> details) {
        AuditLog auditLog = AuditLog.builder()
                .incidentId(incidentId)
                .actorUsername(actorUsername != null ? actorUsername : "system")
                .actorName(actorName != null ? actorName : "System")
                .action(action)
                .description(description)
                .details(serializeDetails(incidentId, details))
                .timestamp(LocalDateTime.now())
                .build();
        log.info("Audit log recorded: [{}] {} for incident {}", action, description, incidentId);
        return auditLogRepository.save(auditLog);
    }

    private String serializeDetails(String incidentId, Map<String, Object> details) {
        if (details == null || details.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException exception) {
            log.error("Unable to serialize audit details for incident {}", incidentId, exception);
            throw new IllegalArgumentException("Audit details must be JSON serializable");
        }
    }

    public List<AuditLog> getLogsForIncident(String incidentId) {
        return auditLogRepository.findByIncidentIdOrderByTimestampDesc(incidentId);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }
}
