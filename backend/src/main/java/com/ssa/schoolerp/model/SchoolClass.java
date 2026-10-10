package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** A class section such as "5-B"; the id is always "{grade}-{section}". */
@Entity
@JsonFields
public class SchoolClass implements Identifiable {

    @Id
    private String id;

    @Min(1)
    @Max(12)
    private int grade;

    @NotBlank
    @Pattern(regexp = "[A-Z]", message = "Section must be a single capital letter")
    private String section;

    private String classTeacherId;
    private String room;
    private String academicYear;

    protected SchoolClass() {
    }

    public SchoolClass(String id, int grade, String section, String classTeacherId, String room, String academicYear) {
        this.id = id;
        this.grade = grade;
        this.section = section;
        this.classTeacherId = classTeacherId;
        this.room = room;
        this.academicYear = academicYear;
    }

    public static String idFor(int grade, String section) {
        return grade + "-" + section;
    }

    public SchoolClass withClassTeacherId(String teacherId) {
        return new SchoolClass(id, grade, section, teacherId, room, academicYear);
    }

    @Override
    public String id() {
        return id;
    }

    public int grade() {
        return grade;
    }

    public String section() {
        return section;
    }

    public String classTeacherId() {
        return classTeacherId;
    }

    public String room() {
        return room;
    }

    public String academicYear() {
        return academicYear;
    }
}
