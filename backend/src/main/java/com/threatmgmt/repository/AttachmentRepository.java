package com.threatmgmt.repository;

import com.threatmgmt.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, String> {
    List<Attachment> findByIncidentIdOrderByUploadedAtDesc(String incidentId);
    long countByIncidentId(String incidentId);
}
