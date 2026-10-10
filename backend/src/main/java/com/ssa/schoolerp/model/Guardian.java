package com.ssa.schoolerp.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record Guardian(
        @NotBlank String name,
        String relation,
        String phone,
        @Email String email) {
}
