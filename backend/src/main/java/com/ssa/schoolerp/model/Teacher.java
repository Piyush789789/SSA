package com.ssa.schoolerp.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record Teacher(
        String id,
        @NotBlank String name,
        @NotBlank @Email String email,
        String phone,
        String qualification,
        String experience,
        LocalDate joiningDate,
        @NotEmpty List<String> subjects,
        @NotNull List<String> assignedClasses) implements Identifiable {

    public Teacher withId(String newId) {
        return new Teacher(newId, name, email, phone, qualification, experience, joiningDate, subjects,
                assignedClasses);
    }

    public boolean teaches(String className, String subject) {
        return assignedClasses.contains(className) && subjects.contains(subject);
    }
}
