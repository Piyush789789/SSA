package com.ssa.schoolerp.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ssa.schoolerp.model.Exam;
import com.ssa.schoolerp.model.ExamSchedule;
import com.ssa.schoolerp.model.SchoolSettings;
import com.ssa.schoolerp.model.StaffAttendance;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Substitution;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Requests and views for staff attendance, leave, substitutions, seating, homework submissions and imports. */
public final class OperationsDtos {

    private OperationsDtos() {
    }

    // ---------------------------------------------------------------- leave

    /** {@code studentId} is required when a parent applies (which child); ignored for students and teachers. */
    public record LeaveApplication(
            String studentId,
            @NotNull LocalDate fromDate,
            @NotNull LocalDate toDate,
            @NotBlank @Size(max = 1000) String reason) {
    }

    public record LeaveDecision(@NotNull Boolean approve, @Size(max = 1000) String note) {
    }

    // ---------------------------------------------------------------- staff attendance

    public record StaffAttendanceEntry(
            @NotBlank String teacherId,
            @NotBlank @Pattern(regexp = "PRESENT|ABSENT|LEAVE|HALF_DAY") String status,
            @JsonFormat(pattern = "HH:mm") LocalTime checkIn,
            @JsonFormat(pattern = "HH:mm") LocalTime checkOut) {
    }

    public record StaffAttendanceRequest(@NotNull LocalDate date, @NotEmpty List<@Valid StaffAttendanceEntry> entries) {
    }

    /** One teacher's row on the daily sheet; {@code record} is null until marked. */
    public record StaffDayRow(String teacherId, String teacherName, String phone, List<String> subjects,
                              StaffAttendance record, String approvedLeaveId) {
    }

    public record StaffStats(String teacherId, String teacherName, int workingDays, int present, int absent,
                             int leave, int halfDay, Double rate) {
    }

    // ---------------------------------------------------------------- substitutions

    /** A period whose teacher is away that day, with who already covers it and who is free to. */
    public record CoverNeed(
            String className,
            String periodId,
            String periodLabel,
            @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            @JsonFormat(pattern = "HH:mm") LocalTime endTime,
            String subject,
            String room,
            String teacherId,
            String teacherName,
            Substitution substitution,
            List<FreeTeacher> freeTeachers) {
    }

    /** {@code teachesSubject}/{@code teachesClass} help pick the best substitute; {@code periodsToday} spreads load. */
    public record FreeTeacher(String teacherId, String name, boolean teachesSubject, boolean teachesClass,
                              int periodsToday) {
    }

    public record SubstitutionRequest(@NotNull LocalDate date, @NotBlank String className, @NotBlank String periodId,
                                      @NotBlank String substituteTeacherId) {
    }

    /** A teacher's periods for a date: their own timetable, minus periods covered by others, plus covers. */
    public record TeacherPeriod(
            String periodId,
            String label,
            @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            @JsonFormat(pattern = "HH:mm") LocalTime endTime,
            String className,
            String subject,
            String room,
            boolean substitution,
            String coveringFor) {
    }

    // ---------------------------------------------------------------- calendar

    public record HolidayCheck(LocalDate date, boolean holiday, String title) {
    }

    // ---------------------------------------------------------------- exam seating & admit cards

    public record Room(@NotBlank @Size(max = 40) String room, @Min(1) int capacity) {
    }

    /** {@code classes} limits the plan to some of the exam's classes (default all). */
    public record SeatingRequest(@NotEmpty List<@Valid Room> rooms, List<String> classes) {
    }

    public record RoomPlan(String room, int capacity, List<SeatView> seats) {
    }

    public record SeatView(int seatNumber, String studentId, String studentName, String className, Integer rollNumber) {
    }

    public record SeatingPlan(String examId, String examName, int seated, List<RoomPlan> rooms) {
    }

    public record AdmitCard(Student student, String room, Integer seatNumber, List<ExamSchedule> papers) {
    }

    public record AdmitCards(SchoolSettings school, Exam exam, String className, List<AdmitCard> cards) {
    }

    // ---------------------------------------------------------------- homework submissions

    public record SubmissionRequest(@Size(max = 4000) String text, List<String> fileIds) {
    }

    public record SubmissionReview(@NotBlank @Pattern(regexp = "REVIEWED|REDO") String status,
                                   @Size(max = 10) String grade, @Size(max = 2000) String feedback) {
    }

    // ---------------------------------------------------------------- bulk import

    public record ImportRequest(@NotBlank String csv, boolean dryRun, boolean createLogins) {
    }

    public record ImportRowResult(int row, String name, String status, String message, String id) {
    }

    public record ImportResult(boolean dryRun, int total, int valid, int created, int failed,
                               List<ImportRowResult> rows, List<CreatedLogin> logins) {
    }

    public record CreatedLogin(String name, String loginId, String temporaryPassword) {
    }

    public record UploadedFile(String id, String fileName, String contentType, long sizeBytes) {
    }
}
