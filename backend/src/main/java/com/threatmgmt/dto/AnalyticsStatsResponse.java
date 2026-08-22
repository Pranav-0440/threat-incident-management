package com.threatmgmt.dto;

import java.util.Map;

public record AnalyticsStatsResponse(
        long total,
        long open,
        long investigating,
        long waitingEvidence,
        long resolved,
        long closed,
        long critical,
        long high,
        long medium,
        long low,
        double averageRiskScore,
        double averageResolutionHours,
        double slaComplianceRate,
        long overdueCount,
        String topThreatVector,
        double topThreatVectorPercent,
        Map<String, Long> categoryCounts,
        Map<String, Long> locationCounts) {
}
