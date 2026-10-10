package com.ssa.schoolerp.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * An exam event spanning several days and classes. {@code status} is derived from the dates on
 * every read; {@code resultsStatus} is "Draft" until an admin publishes the results.
 */
public record Exam(
        String id,
        @NotBlank String name,
        @NotBlank String type,
        String academicYear,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotEmpty List<String> classes,
        String description,
        String status,
        String resultsStatus) implements Identifiable {

    public static final String RESULTS_DRAFT = "Draft";
    public static final String RESULTS_PUBLISHED = "Published";

    public boolean isPublished() {
        return RESULTS_PUBLISHED.equals(resultsStatus);
    }

    public Exam withId(String newId) {
        return new Exam(newId, name, type, academicYear, startDate, endDate, classes, description, status,
                resultsStatus);
    }

    public Exam withStatus(String newStatus) {
        return new Exam(id, name, type, academicYear, startDate, endDate, classes, description, newStatus,
                resultsStatus);
    }

    public Exam withResultsStatus(String newResultsStatus) {
        return new Exam(id, name, type, academicYear, startDate, endDate, classes, description, status,
                newResultsStatus);
    }
}
