package com.threatmgmt.service;

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

    public AuditLog logEvent(String incidentId, String actorUsername, String actorName, String action, String description, Map<String, Object> details) {
        AuditLog auditLog = AuditLog.builder()
                .incidentId(incidentId)
                .actorUsername(actorUsername != null ? actorUsername : "system")
                .actorName(actorName != null ? actorName : "System")
                .action(action)
                .description(description)
                .details(details != null ? details.toString() : null)
                .timestamp(LocalDateTime.now())
                .build();
        log.info("Audit log recorded: [{}] {} for incident {}", action, description, incidentId);
        return auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getLogsForIncident(String incidentId) {
        return auditLogRepository.findByIncidentIdOrderByTimestampDesc(incidentId);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }
}
