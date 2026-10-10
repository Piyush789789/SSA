package com.ssa.schoolerp.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * An exam event spanning several days and classes. {@code status} is derived from the dates on
 * every read; {@code resultsStatus} is "Draft" until an admin publishes the results.
 */
@Entity
@JsonFields
public class Exam implements Identifiable {

    public static final String RESULTS_DRAFT = "Draft";
    public static final String RESULTS_PUBLISHED = "Published";

    @Id
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    private String type;

    private String academicYear;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotEmpty
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exam_class", joinColumns = @JoinColumn(name = "exam_id"))
    @Column(name = "class_name")
    @OrderColumn(name = "position")
    private List<String> classes = new ArrayList<>();

    @Column(length = 2000)
    private String description;

    private String status;
    private String resultsStatus;

    protected Exam() {
    }

    public Exam(String id, String name, String type, String academicYear, LocalDate startDate, LocalDate endDate,
                List<String> classes, String description, String status, String resultsStatus) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.academicYear = academicYear;
        this.startDate = startDate;
        this.endDate = endDate;
        this.classes = new ArrayList<>(classes);
        this.description = description;
        this.status = status;
        this.resultsStatus = resultsStatus;
    }

    public boolean isPublished() {
        return RESULTS_PUBLISHED.equals(resultsStatus);
    }

    public Exam withStatus(String newStatus) {
        return new Exam(id, name, type, academicYear, startDate, endDate, classes, description, newStatus,
                resultsStatus);
    }

    public Exam withResultsStatus(String newResultsStatus) {
        return new Exam(id, name, type, academicYear, startDate, endDate, classes, description, status,
                newResultsStatus);
    }

    @Override
    public String id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String type() {
        return type;
    }

    public String academicYear() {
        return academicYear;
    }

    public LocalDate startDate() {
        return startDate;
    }

    public LocalDate endDate() {
        return endDate;
    }

    public List<String> classes() {
        return classes;
    }

    public String description() {
        return description;
    }

    public String status() {
        return status;
    }

    public String resultsStatus() {
        return resultsStatus;
    }
}
