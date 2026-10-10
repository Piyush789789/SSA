package com.ssa.schoolerp.model;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Embeddable
public record Guardian(
        @NotBlank String name,
        String relation,
        String phone,
        @Email String email) {
}
