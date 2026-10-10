package com.ssa.schoolerp.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record Student(
        String id,
        @NotBlank String name,
        @NotBlank String className,
        @Positive Integer rollNumber,
        @Pattern(regexp = "Male|Female|Other") String gender,
        @Past LocalDate dateOfBirth,
        String bloodGroup,
        @Email String email,
        String address,
        LocalDate admissionDate,
        @Valid Guardian guardian) implements Identifiable {

    public Student withIdAndRollNumber(String newId, int newRollNumber) {
        return new Student(newId, name, className, newRollNumber, gender, dateOfBirth, bloodGroup, email,
                address, admissionDate, guardian);
    }
}
