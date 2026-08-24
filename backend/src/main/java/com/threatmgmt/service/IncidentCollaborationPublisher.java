package com.threatmgmt.service;

import com.threatmgmt.dto.IncidentCollaborationEvent;
import com.threatmgmt.model.Incident;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentCollaborationPublisher {

    private static final String INCIDENT_TOPIC = "/topic/incidents";

    private final SimpMessagingTemplate messagingTemplate;

    public void publishStatusChanged(Incident incident, String previousStatus, String updatedBy) {
        IncidentCollaborationEvent event = new IncidentCollaborationEvent(
                "INCIDENT_STATUS_CHANGED",
                incident.getId(),
                incident.getTitle(),
                previousStatus,
                incident.getStatus(),
                updatedBy,
                incident.getUpdatedAt() != null ? incident.getUpdatedAt() : LocalDateTime.now());
        try {
            messagingTemplate.convertAndSend(INCIDENT_TOPIC, event);
        } catch (RuntimeException ex) {
            log.warn("Unable to publish live incident status update for {}: {}", incident.getId(), ex.getMessage());
        }
    }
}
