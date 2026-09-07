package com.threatmgmt.repository;

import com.threatmgmt.model.Incident;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collection;
import java.util.Locale;

public final class IncidentSpecifications {

    private IncidentSpecifications() {
    }

    public static Specification<Incident> matching(
            String username,
            boolean privileged,
            String query,
            Collection<String> severities,
            Collection<String> statuses,
            Collection<String> categories,
            Collection<String> priorities,
            LocalDate startDate,
            LocalDate endDate) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction();

            if (!privileged) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.equal(root.get("assignedTo"), username),
                        criteriaBuilder.equal(root.get("reportedBy"), username)));
            }

            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("location")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("reportedBy")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("assignedTo")), pattern)));
            }

            predicate = addInPredicate(criteriaBuilder, root.get("severity"), severities, predicate);
            predicate = addInPredicate(criteriaBuilder, root.get("status"), statuses, predicate);
            predicate = addInPredicate(criteriaBuilder, root.get("category"), categories, predicate);
            predicate = addInPredicate(criteriaBuilder, root.get("priority"), priorities, predicate);

            if (startDate != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                LocalDateTime endOfDay = endDate.atTime(LocalTime.MAX);
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endOfDay));
            }

            return predicate;
        };
    }

    private static Predicate addInPredicate(
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            jakarta.persistence.criteria.Expression<String> expression,
            Collection<String> values,
            Predicate current) {
        if (values == null || values.isEmpty()) {
            return current;
        }
        return criteriaBuilder.and(current, expression.in(values));
    }
}
