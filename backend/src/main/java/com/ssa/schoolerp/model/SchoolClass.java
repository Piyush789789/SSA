package com.ssa.schoolerp.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** A class section such as "5-B"; the id is always "{grade}-{section}". */
public record SchoolClass(
        String id,
        @Min(1) @Max(12) int grade,
        @NotBlank @Pattern(regexp = "[A-Z]", message = "Section must be a single capital letter") String section,
        String classTeacherId,
        String room,
        String academicYear) implements Identifiable {

    public static String idFor(int grade, String section) {
        return grade + "-" + section;
    }

    public SchoolClass withId(String newId) {
        return new SchoolClass(newId, grade, section, classTeacherId, room, academicYear);
    }

    public SchoolClass withClassTeacherId(String teacherId) {
        return new SchoolClass(id, grade, section, teacherId, room, academicYear);
    }
}
