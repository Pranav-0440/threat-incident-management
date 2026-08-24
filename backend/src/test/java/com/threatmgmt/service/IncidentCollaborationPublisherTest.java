package com.threatmgmt.service;

import com.threatmgmt.dto.IncidentCollaborationEvent;
import com.threatmgmt.model.Incident;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class IncidentCollaborationPublisherTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void publishStatusChanged_sendsStructuredEventToIncidentTopic() {
        IncidentCollaborationPublisher publisher = new IncidentCollaborationPublisher(messagingTemplate);
        Incident incident = Incident.builder()
                .id("incident-1")
                .title("Phishing attempt")
                .status("INVESTIGATING")
                .updatedAt(LocalDateTime.now())
                .build();

        publisher.publishStatusChanged(incident, "OPEN", "analyst");

        ArgumentCaptor<IncidentCollaborationEvent> eventCaptor =
                ArgumentCaptor.forClass(IncidentCollaborationEvent.class);
        verify(messagingTemplate).convertAndSend(org.mockito.ArgumentMatchers.eq("/topic/incidents"), eventCaptor.capture());
        IncidentCollaborationEvent event = eventCaptor.getValue();
        assertEquals("INCIDENT_STATUS_CHANGED", event.eventType());
        assertEquals("incident-1", event.incidentId());
        assertEquals("OPEN", event.previousStatus());
        assertEquals("INVESTIGATING", event.status());
        assertEquals("analyst", event.updatedBy());
    }
}
