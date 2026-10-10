package com.ssa.schoolerp.security;

import com.ssa.schoolerp.model.AuditEvent;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/** Records every successful change (POST/PUT/DELETE) made by a signed-in user in the audit log. */
@Component
public class AuditInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuditInterceptor.class);

    /** Plain-language names for the most common actions; anything else is described from the URL. */
    private static final Map<Pattern, String> ACTIONS = new LinkedHashMap<>();

    static {
        action("PUT /api/attendance", "Marked attendance");
        action("PUT /api/exam-schedules/[^/]+/marks", "Entered marks");
        action("POST /api/exams/[^/]+/publish", "Published results");
        action("POST /api/exams/[^/]+/unpublish", "Unpublished results");
        action("POST /api/fees/payments", "Collected a fee payment");
        action("POST /api/fees/deposits", "Reported a fee deposit");
        action("POST /api/fees/deposits/[^/]+/approve", "Approved a fee deposit");
        action("POST /api/fees/deposits/[^/]+/reject", "Rejected a fee deposit");
        action("POST /api/fees/concessions", "Granted a concession");
        action("DELETE /api/fees/concessions/[^/]+", "Withdrew a concession");
        action("POST /api/students", "Admitted a student");
        action("POST /api/students/[^/]+/certificates", "Issued a certificate");
        action("POST /api/accounts", "Created a login");
        action("POST /api/accounts/[^/]+/reset-password", "Reset a password");
        action("PUT /api/accounts/[^/]+/active", "Enabled/disabled a login");
        action("POST /api/auth/change-password", "Changed own password");
        action("POST /api/admin/promotion", "Ran end-of-year promotion");
        action("POST /api/admin/demo-data/reset", "Reset the demo data");
        action("POST /api/admin/backups", "Started a database backup");
        action("POST /api/messages", "Sent a message");
    }

    private static void action(String pattern, String description) {
        ACTIONS.put(Pattern.compile(pattern), description);
    }

    private final DataStore store;
    private final Clock clock;

    public AuditInterceptor(DataStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String method = request.getMethod();
        if (!(handler instanceof HandlerMethod) || ex != null || response.getStatus() >= 400
                || !("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method))) {
            return;
        }
        Object principal = request.getAttribute(AuthInterceptor.CURRENT_USER);
        if (!(principal instanceof User user)) {
            return; // login/logout and other public calls
        }
        String path = request.getRequestURI();
        if (path.endsWith("/marks-progress")) {
            return;
        }
        try {
            store.audit.save(new AuditEvent(UUID.randomUUID().toString(), LocalDateTime.now(clock), user.getId(),
                    user.getName(), user.getRole().name(), method, path, describe(method, path), response.getStatus()));
        } catch (RuntimeException e) {
            // The change itself succeeded; a logging failure must not turn it into an error.
            log.warn("Could not write audit event for {} {}", method, path, e);
        }
    }

    static String describe(String method, String path) {
        String request = method + " " + path;
        for (Map.Entry<Pattern, String> entry : ACTIONS.entrySet()) {
            if (entry.getKey().matcher(request).matches()) {
                return entry.getValue();
            }
        }
        String[] parts = path.replaceFirst("^/api/", "").split("/");
        String resource = parts.length > 0 ? parts[0].replace('-', ' ') : "record";
        String verb = switch (method) {
            case "POST" -> "Created";
            case "PUT" -> "Updated";
            default -> "Deleted";
        };
        return verb + " " + resource;
    }
}
