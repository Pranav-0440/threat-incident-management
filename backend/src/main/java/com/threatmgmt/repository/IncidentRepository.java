package com.threatmgmt.repository;

import com.threatmgmt.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {

    List<Incident> findBySeverity(String severity);

    List<Incident> findByStatus(String status);

    List<Incident> findByReportedBy(String userId);

    List<Incident> findByAssignedToOrReportedBy(String assignedTo, String reportedBy);

    List<Incident> findByCategory(String category);

    long countByStatus(String status);

    long countBySeverity(String severity);

    List<Incident> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);

    // Native PostgreSQL Full-Text Search
    @Query(value = "SELECT * FROM incidents WHERE to_tsvector('english', title || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', :query)", nativeQuery = true)
    List<Incident> searchIncidentsNative(@Param("query") String query);
}
