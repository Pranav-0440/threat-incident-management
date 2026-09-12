package com.threatmgmt.service;

import com.threatmgmt.repository.IncidentSearchRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ElasticsearchSyncServiceTest {

    @Mock
    private ObjectProvider<IncidentSearchRepository> repositoryProvider;

    @Mock
    private IncidentSearchRepository searchRepository;

    @Test
    void deleteById_withoutSearchRepository_isSafeNoOp() {
        when(repositoryProvider.getIfAvailable()).thenReturn(null);
        ElasticsearchSyncService service = new ElasticsearchSyncService(repositoryProvider);

        service.deleteById("incident-1");

        verify(repositoryProvider).getIfAvailable();
        verify(searchRepository, never()).deleteById("incident-1");
    }

    @Test
    void deleteById_withSearchRepository_delegatesDelete() {
        when(repositoryProvider.getIfAvailable()).thenReturn(searchRepository);
        ElasticsearchSyncService service = new ElasticsearchSyncService(repositoryProvider);

        service.deleteById("incident-1");

        verify(searchRepository).deleteById("incident-1");
    }
}
