package com.threatmgmt.repository;

import com.threatmgmt.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByIncidentIdOrderByTimestampDesc(String incidentId);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
