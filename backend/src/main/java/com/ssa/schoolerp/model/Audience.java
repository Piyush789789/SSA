package com.ssa.schoolerp.model;

/** Who can see a notice. Admins and the notice's author always can. */
public enum Audience {
    ALL, STAFF, STUDENTS, PARENTS;

    public boolean includes(Role role) {
        return switch (this) {
            case ALL -> true;
            case STAFF -> role == Role.ADMIN || role == Role.TEACHER;
            case STUDENTS -> role == Role.STUDENT;
            case PARENTS -> role == Role.PARENT;
        };
    }
}
