package com.ssa.schoolerp.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record Homework(
        String id,
        @NotBlank String title,
        String description,
        @NotBlank String subject,
        @NotBlank String className,
        LocalDate assignedDate,
        @NotNull LocalDate dueDate,
        String instructions,
        List<String> attachments,
        String teacherId,
        String teacherName) implements Identifiable {
}
