package com.ssa.schoolerp.dto;

import com.ssa.schoolerp.model.AttendanceStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public final class AttendanceDtos {

    private AttendanceDtos() {
    }

    /** Marks (or re-marks) a class for one day. Existing records for that day are overwritten. */
    public record SaveRequest(
            @NotBlank String className,
            @NotNull LocalDate date,
            @NotEmpty List<@Valid Entry> entries) {
    }

    public record Entry(
            @NotBlank String studentId,
            @NotNull AttendanceStatus status,
            String checkInTime,
            String remarks) {
    }

    /**
     * Holidays are not working days. Late counts as attended. {@code rate} is null when there are no
     * working days in the range, rather than a made-up number.
     */
    public record Stats(int workingDays, int present, int absent, int late, int leave, Double rate) {
    }

    public record ClassDaySummary(
            String className,
            LocalDate date,
            int totalStudents,
            int present,
            int absent,
            int late,
            int leave,
            int notMarked,
            Double rate) {
    }

    public record LowAttendance(String studentId, String name, String className, Double rate) {
    }
}
