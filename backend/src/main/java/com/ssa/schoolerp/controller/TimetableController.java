package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.ScheduleSlot;
import com.ssa.schoolerp.dto.TimetableEntryRequest;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.TimetableEntry;
import com.ssa.schoolerp.model.TimetablePeriod;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.TimetableService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/timetable")
public class TimetableController {

    public record PeriodsRequest(@NotEmpty List<@Valid TimetablePeriod> periods) {
    }

    private final TimetableService timetable;
    private final Clock clock;

    public TimetableController(TimetableService timetable, Clock clock) {
        this.timetable = timetable;
        this.clock = clock;
    }

    @GetMapping("/periods")
    public ApiResponse<List<TimetablePeriod>> periods() {
        return ApiResponse.of(timetable.periods());
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/periods")
    public ApiResponse<List<TimetablePeriod>> replacePeriods(@Valid @RequestBody PeriodsRequest request) {
        return ApiResponse.success("Periods updated", timetable.replacePeriods(request.periods()));
    }

    @GetMapping
    public ApiResponse<List<TimetableEntry>> forClass(@CurrentUser User user, @RequestParam String className) {
        return ApiResponse.of(timetable.forClass(user, className));
    }

    /** A class's whole day period by period (default: today). */
    @GetMapping("/day")
    public ApiResponse<List<ScheduleSlot>> day(@CurrentUser User user, @RequestParam String className,
                                               @RequestParam(required = false) DayOfWeek day) {
        return ApiResponse.of(timetable.daySchedule(user, className, day != null ? day : LocalDate.now(clock).getDayOfWeek()));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/teachers/{teacherId}")
    public ApiResponse<List<TimetableEntry>> forTeacher(@CurrentUser User user, @PathVariable String teacherId) {
        return ApiResponse.of(timetable.forTeacher(user, teacherId));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/entries")
    public ApiResponse<TimetableEntry> saveEntry(@Valid @RequestBody TimetableEntryRequest request) {
        return ApiResponse.success("Timetable updated", timetable.saveEntry(request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/entries/{id}")
    public ApiResponse<Void> deleteEntry(@PathVariable String id) {
        timetable.deleteEntry(id);
        return ApiResponse.success("Timetable entry removed");
    }
}
