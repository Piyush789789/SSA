package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

@Entity
@JsonFields
public class Notice implements Identifiable {

    @Id
    private String id;

    @NotBlank
    private String title;

    @NotBlank
    @Column(length = 4000)
    private String description;

    @Pattern(regexp = "high|medium|low")
    private String priority;

    @Enumerated(EnumType.STRING)
    private Audience audience;

    private String authorId;
    private String authorName;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    protected Notice() {
    }

    public Notice(String id, String title, String description, String priority, Audience audience, String authorId,
                  String authorName, LocalDate createdAt, LocalDate updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.audience = audience;
        this.authorId = authorId;
        this.authorName = authorName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @Override
    public String id() {
        return id;
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }

    public String priority() {
        return priority;
    }

    public Audience audience() {
        return audience;
    }

    public String authorId() {
        return authorId;
    }

    public String authorName() {
        return authorName;
    }

    public LocalDate createdAt() {
        return createdAt;
    }

    public LocalDate updatedAt() {
        return updatedAt;
    }
}
