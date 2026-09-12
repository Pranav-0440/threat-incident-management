package com.threatmgmt.service;

import com.threatmgmt.repository.IncidentSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

/**
 * Keeps optional Elasticsearch synchronization isolated from the transactional
 * incident lifecycle. Transient search-backend failures are retried without
 * allowing them to roll back the PostgreSQL delete.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchSyncService {

    private final ObjectProvider<IncidentSearchRepository> searchRepositoryProvider;

    @Retryable(
            retryFor = Exception.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 250, multiplier = 2.0)
    )
    public void deleteById(String id) {
        IncidentSearchRepository searchRepository = searchRepositoryProvider.getIfAvailable();
        if (searchRepository == null) {
            log.debug("Elasticsearch is not configured; skipping delete for incident {}", id);
            return;
        }
        searchRepository.deleteById(id);
    }
}

