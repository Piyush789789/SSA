package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.AttendanceDtos.ClassDaySummary;
import com.ssa.schoolerp.dto.ClassView;
import com.ssa.schoolerp.dto.FeeDtos.Overview;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.AttendanceService;
import com.ssa.schoolerp.service.DashboardService;
import com.ssa.schoolerp.service.FeeService;
import com.ssa.schoolerp.service.SchoolService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Admin-only shortcuts. The full resources live under /api/students, /api/teachers, /api/classes,
 * /api/attendance and /api/fees; these endpoints are kept for the existing frontend client.
 */
@RestController
@RequestMapping("/api/admin")
@RequireRole(Role.ADMIN)
public class AdminController {

    private final DataStore store;
    private final DashboardService dashboard;
    private final AttendanceService attendance;
    private final FeeService fees;
    private final SchoolService school;
    private final Clock clock;

    public AdminController(DataStore store, DashboardService dashboard, AttendanceService attendance, FeeService fees,
                           SchoolService school, Clock clock) {
        this.store = store;
        this.dashboard = dashboard;
        this.attendance = attendance;
        this.fees = fees;
        this.school = school;
        this.clock = clock;
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> getDashboard(@CurrentUser User user) {
        return ApiResponse.success("Dashboard data fetched successfully", dashboard.admin(user));
    }

    @GetMapping("/students")
    public ApiResponse<List<Student>> getStudents() {
        return ApiResponse.of(store.students.findAll());
    }

    @GetMapping("/teachers")
    public ApiResponse<List<Teacher>> getTeachers() {
        return ApiResponse.of(store.teachers.findAll());
    }

    @GetMapping("/classes")
    public ApiResponse<List<ClassView>> getClasses(@CurrentUser User user) {
        return ApiResponse.of(school.classes(user));
    }

    @GetMapping("/attendance/today")
    public ApiResponse<ClassDaySummary> getTodayAttendance() {
        return ApiResponse.success("Today attendance fetched successfully",
                attendance.schoolSummary(LocalDate.now(clock)));
    }

    @GetMapping("/fees/today")
    public ApiResponse<Overview> getTodayFees() {
        return ApiResponse.success("Today fees fetched successfully", fees.overview(null));
    }

    /** Throws away every change and reloads the demo data set. */
    @PostMapping("/demo-data/reset")
    public ApiResponse<Void> resetDemoData() {
        store.reset();
        return ApiResponse.success("Demo data has been reset");
    }
}
