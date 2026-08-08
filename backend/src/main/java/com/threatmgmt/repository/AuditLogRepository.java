package com.threatmgmt.repository;

import com.threatmgmt.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByIncidentIdOrderByTimestampDesc(String incidentId);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
