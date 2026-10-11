package com.ssa.schoolerp.model;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** One question of an exam paper, e.g. "Q1" worth 5 marks. Half marks are allowed. */
@Embeddable
public record Question(
        @NotBlank @Size(max = 20) String label,
        @DecimalMin(value = "0.5") @DecimalMax(value = "1000") double maxMarks) {
}
