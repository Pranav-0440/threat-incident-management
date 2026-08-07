package com.threatmgmt.security;

import com.threatmgmt.model.Incident;
import com.threatmgmt.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class IncidentPermissionEvaluator implements PermissionEvaluator {

    private final IncidentRepository incidentRepository;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetId, Object permission) {
        if (authentication == null || targetId == null) {
            return false;
        }

        Optional<Incident> incidentOpt = incidentRepository.findById((String) targetId);
        if (incidentOpt.isEmpty()) {
            return false; // controller/service returns 404 separately
        }
        Incident incident = incidentOpt.get();

        String username = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        boolean isAssignedToMe = username.equals(incident.getAssignedTo());
        boolean isUnassigned   = incident.getAssignedTo() == null || incident.getAssignedTo().isBlank();
        boolean isReporter     = username.equals(incident.getReportedBy());

        String permissionStr = permission.toString();

        return switch (permissionStr) {
            case "write" -> isAdmin || isAssignedToMe || isUnassigned;
            case "read"  -> isAdmin || isAssignedToMe || isReporter;
            default -> false;
        };
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId,
                                  String targetType, Object permission) {
        return hasPermission(authentication, targetId, permission);
    }
}