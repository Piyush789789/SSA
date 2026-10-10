package com.ssa.schoolerp.model;

import java.util.List;

/**
 * What a limited staff login (an ADMIN account with permissions) may change. Full admins have none listed and may
 * do everything. Staff can read the admin screens; changes need the module's permission. Settings, logins,
 * promotion, backups and the audit log stay with full admins.
 */
public enum Permission {
    FEES("Fees & payments", List.of("/api/fees", "/api/online-payments", "/api/fee-reminders")),
    ADMISSIONS("Students & admissions", List.of("/api/students", "/api/classes", "/api/parents", "/api/import",
            "/api/certificates", "/api/enquiries", "/api/id-cards", "/api/health-records")),
    ATTENDANCE("Attendance & leave", List.of("/api/attendance", "/api/staff-attendance", "/api/leaves")),
    ACADEMICS("Exams, timetable & homework", List.of("/api/exams", "/api/exam-schedules", "/api/timetable",
            "/api/homework", "/api/study-materials", "/api/report-cards", "/api/substitutions", "/api/calendar",
            "/api/ptm")),
    STAFF("Teachers & staff", List.of("/api/teachers", "/api/staff-attendance", "/api/leaves")),
    COMMUNICATION("Notices & messages", List.of("/api/notices", "/api/messages", "/api/events")),
    TRANSPORT("Transport", List.of("/api/transport")),
    LIBRARY("Library", List.of("/api/library"));

    private final String label;
    private final List<String> pathPrefixes;

    Permission(String label, List<String> pathPrefixes) {
        this.label = label;
        this.pathPrefixes = pathPrefixes;
    }

    public String label() {
        return label;
    }

    public boolean covers(String path) {
        return matches(pathPrefixes, path);
    }

    private static final List<String> FULL_ADMIN_ONLY = List.of("/api/accounts", "/api/settings", "/api/admin/audit",
            "/api/admin/backups", "/api/admin/promotion", "/api/admin/demo-data");

    /** Everyone's own things: password, notifications, push token, uploads. */
    private static final List<String> PERSONAL = List.of("/api/auth", "/api/notifications", "/api/me", "/api/files");

    /** Settings, logins, promotion, backups, the audit log and the demo reset: full admins only, even to read. */
    public static boolean fullAdminOnly(String path) {
        return matches(FULL_ADMIN_ONLY, path);
    }

    public static boolean personal(String path) {
        return matches(PERSONAL, path);
    }

    private static boolean matches(List<String> prefixes, String path) {
        return prefixes.stream().anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }
}
