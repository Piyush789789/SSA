package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.OperationsDtos.CoverNeed;
import com.ssa.schoolerp.dto.OperationsDtos.StaffAttendanceRequest;
import com.ssa.schoolerp.dto.OperationsDtos.StaffDayRow;
import com.ssa.schoolerp.dto.OperationsDtos.StaffStats;
import com.ssa.schoolerp.dto.OperationsDtos.SubstitutionRequest;
import com.ssa.schoolerp.dto.OperationsDtos.TeacherPeriod;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.StaffAttendance;
import com.ssa.schoolerp.model.Substitution;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/** Teachers' attendance, and substitute teachers for absent colleagues. */
@RestController
@RequestMapping("/api")
public class StaffController {

    private final StaffService staff;
    private final Clock clock;

    public StaffController(StaffService staff, Clock clock) {
        this.staff = staff;
        this.clock = clock;
    }

    /** The daily sheet: every teacher with their record (null = not marked) and any approved leave. */
    @RequireRole(Role.ADMIN)
    @GetMapping("/staff-attendance")
    public ApiResponse<List<StaffDayRow>> daySheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.of(staff.daySheet(date != null ? date : today()));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/staff-attendance")
    public ApiResponse<List<StaffAttendance>> mark(@CurrentUser User user,
                                                   @Valid @RequestBody StaffAttendanceRequest request) {
        return ApiResponse.success("Staff attendance saved", staff.mark(user, request));
    }

    @RequireRole(Role.TEACHER)
    @PostMapping("/staff-attendance/check-in")
    public ApiResponse<StaffAttendance> checkIn(@CurrentUser User user) {
        return ApiResponse.success("Checked in", staff.checkIn(user));
    }

    @RequireRole(Role.TEACHER)
    @PostMapping("/staff-attendance/check-out")
    public ApiResponse<StaffAttendance> checkOut(@CurrentUser User user) {
        return ApiResponse.success("Checked out", staff.checkOut(user));
    }

    /** A teacher's own records (admins pass teacherId). Default: the last 30 days. */
    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/staff-attendance/records")
    public ApiResponse<List<StaffAttendance>> records(
            @CurrentUser User user,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : today();
        return ApiResponse.of(staff.records(user, teacherId, from != null ? from : end.minusDays(29), end));
    }

    /** Per-teacher counts for a range (default: this month so far). */
    @RequireRole(Role.ADMIN)
    @GetMapping("/staff-attendance/report")
    public ApiResponse<List<StaffStats>> report(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end = to != null ? to : today();
        return ApiResponse.of(staff.report(from != null ? from : end.withDayOfMonth(1), end));
    }

    /** Periods that need a substitute on a date (default today), with free teachers best-first. */
    @RequireRole(Role.ADMIN)
    @GetMapping("/substitutions/needs")
    public ApiResponse<List<CoverNeed>> needs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.of(staff.coverNeeds(date != null ? date : today()));
    }

    @GetMapping("/substitutions")
    public ApiResponse<List<Substitution>> substitutions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.of(staff.substitutions(date != null ? date : today()));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/substitutions")
    public ApiResponse<Substitution> assign(@CurrentUser User user, @Valid @RequestBody SubstitutionRequest request) {
        return ApiResponse.success("Substitute assigned", staff.assign(user, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/substitutions/{id}")
    public ApiResponse<Void> remove(@PathVariable String id) {
        staff.removeSubstitution(id);
        return ApiResponse.success("Substitution removed");
    }

    /** A teacher's periods for a date including substitutions (teachers: their own; admins pass teacherId). */
    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/timetable/teacher-day")
    public ApiResponse<List<TeacherPeriod>> teacherDay(
            @CurrentUser User user,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.of(staff.teacherDay(user, teacherId, date != null ? date : today()));
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }
}
