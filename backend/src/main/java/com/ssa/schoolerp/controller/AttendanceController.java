package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.AttendanceDtos.ClassDaySummary;
import com.ssa.schoolerp.dto.AttendanceDtos.SaveRequest;
import com.ssa.schoolerp.dto.AttendanceDtos.Stats;
import com.ssa.schoolerp.model.AttendanceRecord;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendance;
    private final Clock clock;

    public AttendanceController(AttendanceService attendance, Clock clock) {
        this.attendance = attendance;
        this.clock = clock;
    }

    /** {@code date} is shorthand for from = to = date. */
    @GetMapping
    public ApiResponse<List<AttendanceRecord>> find(
            @CurrentUser User user,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate start = date != null ? date : from;
        LocalDate end = date != null ? date : to;
        return ApiResponse.of(attendance.find(user, className, studentId, start, end));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PutMapping
    public ApiResponse<List<AttendanceRecord>> save(@CurrentUser User user, @Valid @RequestBody SaveRequest request) {
        return ApiResponse.success("Attendance saved", attendance.save(user, request));
    }

    /** Per-class counts for a day (default today). */
    @GetMapping("/summary")
    public ApiResponse<List<ClassDaySummary>> summary(
            @CurrentUser User user,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.of(attendance.daySummaries(user, date != null ? date : LocalDate.now(clock), className));
    }

    @GetMapping("/students/{studentId}/stats")
    public ApiResponse<Stats> studentStats(
            @CurrentUser User user,
            @PathVariable String studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.of(attendance.statsForStudent(user, studentId, from, to));
    }
}
