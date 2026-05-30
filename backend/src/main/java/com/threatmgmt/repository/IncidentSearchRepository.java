package com.threatmgmt.repository;

import com.threatmgmt.model.IncidentSearchDoc;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentSearchRepository extends ElasticsearchRepository<IncidentSearchDoc, String> {

    List<IncidentSearchDoc> findByTitleContainingOrDescriptionContaining(
            String title, String description);
}
