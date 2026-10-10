package com.ssa.schoolerp.model;

import java.time.LocalDate;

public record AttendanceRecord(
        String id,
        String studentId,
        String className,
        LocalDate date,
        AttendanceStatus status,
        String checkInTime,
        String remarks,
        String markedBy) implements Identifiable {

    /** One record per student per day, so re-marking a day overwrites instead of duplicating. */
    public static String idFor(String studentId, LocalDate date) {
        return "ATT-" + date + "-" + studentId;
    }
}
