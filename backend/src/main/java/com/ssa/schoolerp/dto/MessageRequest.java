package com.ssa.schoolerp.dto;

import com.ssa.schoolerp.model.RecipientType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * CLASS needs {@code className}; STUDENT needs {@code recipientId} = student id;
 * TEACHER needs {@code recipientId} = teacher id.
 */
public record MessageRequest(
        @NotNull RecipientType recipientType,
        String className,
        String recipientId,
        @NotBlank String subject,
        @NotBlank String body) {
}
