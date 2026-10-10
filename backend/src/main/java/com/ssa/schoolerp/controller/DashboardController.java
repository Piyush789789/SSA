package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.model.AttendanceStatus;
import com.ssa.schoolerp.model.Audience;
import com.ssa.schoolerp.model.ReferenceData;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.service.AttendanceService;
import com.ssa.schoolerp.service.DashboardService;
import com.ssa.schoolerp.service.Grading;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboard;
    private final DataStore store;

    public DashboardController(DashboardService dashboard, DataStore store) {
        this.dashboard = dashboard;
        this.store = store;
    }

    /** The dashboard for the signed-in user's role. */
    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(@CurrentUser User user) {
        return ApiResponse.of(dashboard.forUser(user));
    }

    /** Option lists for forms and filters, so the frontend and backend agree on valid values. */
    @GetMapping("/meta")
    public ApiResponse<Map<String, Object>> meta() {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("academicYear", ReferenceData.ACADEMIC_YEAR);
        meta.put("classes", store.classes.stream()
                .sorted(Comparator.comparingInt(SchoolClass::grade).thenComparing(SchoolClass::section))
                .map(SchoolClass::id)
                .toList());
        meta.put("subjects", ReferenceData.SUBJECTS);
        meta.put("examTypes", ReferenceData.EXAM_TYPES);
        meta.put("gradeBands", Grading.BANDS);
        meta.put("attendanceStatuses", List.of(AttendanceStatus.values()));
        meta.put("lowAttendanceThreshold", AttendanceService.LOW_ATTENDANCE_THRESHOLD);
        meta.put("noticeAudiences", List.of(Audience.values()));
        meta.put("materialCategories", ReferenceData.MATERIAL_CATEGORIES);
        meta.put("paymentModes", ReferenceData.PAYMENT_MODES);
        meta.put("feeFrequencies", ReferenceData.FEE_FREQUENCIES);
        meta.put("concessionTypes", ReferenceData.CONCESSION_TYPES);
        return ApiResponse.of(meta);
    }
}
