package com.ssa.schoolerp.dto;

public record ClassView(
        String id,
        int grade,
        String section,
        String room,
        String academicYear,
        String classTeacherId,
        String classTeacherName,
        int studentCount) {
}
