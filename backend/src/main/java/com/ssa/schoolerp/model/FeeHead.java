package com.ssa.schoolerp.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

/** A fee charged to every student of the listed classes. Amounts are whole rupees. */
public record FeeHead(
        String id,
        @NotBlank String title,
        @Positive long amount,
        @NotBlank String frequency,
        @NotNull LocalDate dueDate,
        String academicYear,
        @NotEmpty List<String> classNames) implements Identifiable {

    public FeeHead withId(String newId) {
        return new FeeHead(newId, title, amount, frequency, dueDate, academicYear, classNames);
    }
}
