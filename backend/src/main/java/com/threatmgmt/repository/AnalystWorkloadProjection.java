package com.threatmgmt.repository;

public interface AnalystWorkloadProjection {
    String getUsername();
    Long getTotalAssigned();
    Long getActiveAssigned();
}