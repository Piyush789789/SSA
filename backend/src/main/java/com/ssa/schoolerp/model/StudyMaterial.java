package com.ssa.schoolerp.model;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record StudyMaterial(
        String id,
        @NotBlank String title,
        @NotBlank String subject,
        @NotBlank String className,
        @NotBlank String category,
        LocalDate uploadedDate,
        String fileType,
        String fileSize,
        String teacherId,
        String teacherName) implements Identifiable {
}
