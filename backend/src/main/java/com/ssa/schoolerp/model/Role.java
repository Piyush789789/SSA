package com.ssa.schoolerp.model;

import java.util.Locale;
import java.util.Optional;

public enum Role {
    ADMIN, TEACHER, STUDENT, PARENT;

    public static Optional<Role> parse(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
