package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.OperationsDtos.HolidayCheck;
import com.ssa.schoolerp.model.CalendarEvent;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.CalendarService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/** The holiday and event calendar: everyone reads it, admins edit it. */
@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarService calendar;
    private final Clock clock;

    public CalendarController(CalendarService calendar, Clock clock) {
        this.calendar = calendar;
        this.clock = clock;
    }

    @GetMapping
    public ApiResponse<List<CalendarEvent>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.of(calendar.list(from, to));
    }

    /** Is the date (default today) a holiday or a Sunday? */
    @GetMapping("/check")
    public ApiResponse<HolidayCheck> check(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.of(calendar.check(date != null ? date : LocalDate.now(clock)));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CalendarEvent> create(@Valid @RequestBody CalendarEvent request) {
        return ApiResponse.success("Added to the calendar", calendar.create(request));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/{id}")
    public ApiResponse<CalendarEvent> update(@PathVariable String id, @Valid @RequestBody CalendarEvent request) {
        return ApiResponse.success("Calendar updated", calendar.update(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        calendar.delete(id);
        return ApiResponse.success("Removed from the calendar");
    }
}
