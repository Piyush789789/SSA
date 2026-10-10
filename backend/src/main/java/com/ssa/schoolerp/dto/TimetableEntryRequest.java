package com.ssa.schoolerp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;

public record TimetableEntryRequest(
        @NotBlank String className,
        @NotNull DayOfWeek day,
        @NotBlank String periodId,
        @NotBlank String subject,
        @NotBlank String teacherId,
        String room) {
}
