package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.AuditEvent;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.SchoolSettings;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.PublicEndpoint;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.BackupService;
import com.ssa.schoolerp.service.BackupService.BackupFile;
import com.ssa.schoolerp.service.PromotionService;
import com.ssa.schoolerp.service.PromotionService.PromotionRequest;
import com.ssa.schoolerp.service.PromotionService.PromotionResult;
import com.ssa.schoolerp.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** School settings, end-of-year promotion, backups and the audit log. */
@RestController
@RequestMapping("/api")
public class SchoolAdminController {

    private final SettingsService settings;
    private final PromotionService promotion;
    private final BackupService backups;
    private final DataStore store;

    public SchoolAdminController(SettingsService settings, PromotionService promotion, BackupService backups,
                                 DataStore store) {
        this.settings = settings;
        this.promotion = promotion;
        this.backups = backups;
        this.store = store;
    }

    /** Public: the login screens show the school name. */
    @PublicEndpoint
    @GetMapping("/settings")
    public ApiResponse<SchoolSettings> settings() {
        return ApiResponse.of(settings.get());
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/settings")
    public ApiResponse<SchoolSettings> updateSettings(@Valid @RequestBody SchoolSettings request) {
        return ApiResponse.success("Settings saved", settings.update(request));
    }

    /** With {@code dryRun: true} only reports what would happen. */
    @RequireRole(Role.ADMIN)
    @PostMapping("/admin/promotion")
    public ApiResponse<PromotionResult> promote(@Valid @RequestBody PromotionRequest request) {
        PromotionResult result = promotion.promote(request);
        return ApiResponse.success(request.dryRun() ? "Promotion preview" : "Students promoted to " + request.toAcademicYear(),
                result);
    }

    @RequireRole(Role.ADMIN)
    @GetMapping("/admin/backups")
    public ApiResponse<Map<String, Object>> backups() {
        return ApiResponse.of(Map.of(
                "enabled", backups.enabled(),
                "directory", backups.directory().toString(),
                "files", backups.enabled() ? backups.list() : List.of()));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/admin/backups")
    public ApiResponse<BackupFile> backupNow() {
        try {
            return ApiResponse.success("Backup created", backups.runBackup());
        } catch (IllegalStateException e) {
            throw ApiErrors.badRequest(e.getMessage());
        }
    }

    /** Newest first. {@code q} matches the person's name or the action. */
    @RequireRole(Role.ADMIN)
    @GetMapping("/admin/audit")
    public ApiResponse<List<AuditEvent>> audit(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "200") int limit) {
        List<String> conditions = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        if (from != null) {
            params.add(from.atStartOfDay());
            conditions.add("e.at >= ?" + params.size());
        }
        if (to != null) {
            params.add(to.plusDays(1).atStartOfDay());
            conditions.add("e.at < ?" + params.size());
        }
        if (q != null && !q.isBlank()) {
            params.add("%" + q.trim().toLowerCase() + "%");
            conditions.add("(lower(e.actorName) like ?" + params.size() + " or lower(e.action) like ?" + params.size() + ")");
        }
        String where = conditions.isEmpty() ? "1 = 1" : String.join(" and ", conditions);
        return ApiResponse.of(store.audit.whereLimited(Math.min(Math.max(limit, 1), 1000),
                where + " order by e.at desc", params.toArray()));
    }
}
