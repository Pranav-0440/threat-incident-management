package com.threatmgmt.dto;

import com.threatmgmt.model.Incident;

import java.util.List;

public record IncidentPageResponse(
        List<Incident> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        String sort) {
}
