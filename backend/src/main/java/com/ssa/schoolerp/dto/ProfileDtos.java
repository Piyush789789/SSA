package com.ssa.schoolerp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** What users may change about themselves. Subjects, classes, roll numbers etc. stay admin-only. */
public final class ProfileDtos {

    private ProfileDtos() {
    }

    public record TeacherSelfUpdate(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email String email,
            @Size(max = 30) String phone,
            @Size(max = 200) String qualification,
            @Size(max = 50) String experience) {
    }

    public record ParentSelfUpdate(
            @Size(max = 30) String phone,
            @Email String email) {
    }

    /** A student's contact details, editable by the student, their parent or an admin. */
    public record StudentContactUpdate(
            @Size(max = 300) String address,
            @Size(max = 30) String guardianPhone,
            @Email String guardianEmail) {
    }
}
