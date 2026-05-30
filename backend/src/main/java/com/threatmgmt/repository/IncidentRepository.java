package com.threatmgmt.repository;

import com.threatmgmt.model.Incident;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends MongoRepository<Incident, String> {

    List<Incident> findBySeverity(String severity);

    List<Incident> findByStatus(String status);

    List<Incident> findByReportedBy(String userId);

    List<Incident> findByCategory(String category);

    long countByStatus(String status);

    long countBySeverity(String severity);
}
