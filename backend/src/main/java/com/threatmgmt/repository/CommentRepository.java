package com.threatmgmt.repository;

import com.threatmgmt.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByIncidentIdOrderByCreatedAtAsc(String incidentId);
    long countByIncidentId(String incidentId);
}
