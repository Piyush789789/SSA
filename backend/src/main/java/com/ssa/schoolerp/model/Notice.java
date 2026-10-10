package com.ssa.schoolerp.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record Notice(
        String id,
        @NotBlank String title,
        @NotBlank String description,
        @Pattern(regexp = "high|medium|low") String priority,
        Audience audience,
        String authorId,
        String authorName,
        LocalDate createdAt,
        LocalDate updatedAt) implements Identifiable {
}
