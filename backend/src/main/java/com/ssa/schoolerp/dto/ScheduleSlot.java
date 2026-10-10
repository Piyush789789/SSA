package com.ssa.schoolerp.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;

/**
 * One period of a class's day, including breaks and free periods. {@code subject}, {@code teacherName} and
 * {@code room} are null for breaks and free periods.
 */
public record ScheduleSlot(
        String periodId,
        String label,
        @JsonFormat(pattern = "HH:mm") LocalTime startTime,
        @JsonFormat(pattern = "HH:mm") LocalTime endTime,
        String type,
        String subject,
        String teacherName,
        String room) {
}
