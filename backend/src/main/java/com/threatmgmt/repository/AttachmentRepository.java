package com.threatmgmt.repository;

import com.threatmgmt.model.Attachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends MongoRepository<Attachment, String> {
    List<Attachment> findByIncidentIdOrderByUploadedAtDesc(String incidentId);
    long countByIncidentId(String incidentId);
}
