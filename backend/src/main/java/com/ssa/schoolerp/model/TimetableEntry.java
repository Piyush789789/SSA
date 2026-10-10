package com.ssa.schoolerp.model;

import java.time.DayOfWeek;

public record TimetableEntry(
        String id,
        String className,
        DayOfWeek day,
        String periodId,
        String subject,
        String teacherId,
        String teacherName,
        String room) implements Identifiable {

    /** One entry per class slot, so editing a slot overwrites it. */
    public static String idFor(String className, DayOfWeek day, String periodId) {
        return "TT-" + className + "-" + day + "-" + periodId;
    }
}
