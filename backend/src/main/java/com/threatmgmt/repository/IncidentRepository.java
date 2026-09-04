package com.threatmgmt.repository;

import com.threatmgmt.model.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String>, JpaSpecificationExecutor<Incident> {

    List<Incident> findBySeverity(String severity);

    List<Incident> findByStatus(String status);

    List<Incident> findByReportedBy(String userId);

    List<Incident> findByAssignedToOrReportedBy(String assignedTo, String reportedBy);

    List<Incident> findByCategory(String category);

    long countByStatus(String status);

    long countBySeverity(String severity);

    List<Incident> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);

    @Query("""
            SELECT i FROM Incident i
            WHERE (:privileged = true OR i.assignedTo = :username OR i.reportedBy = :username)
              AND (:query IS NULL OR :query = ''
                   OR LOWER(COALESCE(i.title, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(COALESCE(i.description, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(COALESCE(i.location, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(COALESCE(i.reportedBy, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(COALESCE(i.assignedTo, '')) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:severity IS NULL OR :severity = '' OR i.severity = :severity)
              AND (:status IS NULL OR :status = '' OR i.status = :status)
              AND (:category IS NULL OR :category = '' OR i.category = :category)
              AND (:priority IS NULL OR :priority = '' OR i.priority = :priority)
            """)
    Page<Incident> findPage(@Param("username") String username,
                            @Param("privileged") boolean privileged,
                            @Param("query") String query,
                            @Param("severity") String severity,
                            @Param("status") String status,
                            @Param("category") String category,
                            @Param("priority") String priority,
                            Pageable pageable);

    // Native PostgreSQL Full-Text Search
    @Query(value = "SELECT * FROM incidents WHERE to_tsvector('english', title || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', :query)", nativeQuery = true)
    List<Incident> searchIncidentsNative(@Param("query") String query);
}
