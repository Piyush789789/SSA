package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.LoginResponse;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.LoginRequest;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.seed.SeedData;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private record Session(User user, Instant expiresAt) {
    }

    // In-memory demo users. Passwords are plain text for the prototype only; hash them (e.g. BCrypt)
    // once users move to a real database.
    private final Map<String, User> usersByEmail = new ConcurrentHashMap<>();

    // In-memory active sessions: token -> session
    private final Map<String, Session> activeSessions = new ConcurrentHashMap<>();

    private final Clock clock;
    private final Duration sessionTtl;

    public AuthService(Clock clock, @Value("${app.auth.session-ttl:PT8H}") Duration sessionTtl) {
        this.clock = clock;
        this.sessionTtl = sessionTtl;
        initDemoUsers();
    }

    private void initDemoUsers() {
        addUser(new User("admin-001", "School Administrator", "admin@ssa.edu", "admin123", Role.ADMIN, null));
        addUser(new User("teacher-001", "Anjali Singh", "teacher@ssa.edu", "teacher123", Role.TEACHER,
                SeedData.DEMO_TEACHER_ID));
        addUser(new User("student-001", "Rohit Verma", "student@ssa.edu", "student123", Role.STUDENT,
                SeedData.DEMO_STUDENT_ID));
        addUser(new User("parent-001", "Rajesh Verma", "parent@ssa.edu", "parent123", Role.PARENT,
                SeedData.DEMO_PARENT_ID));
    }

    private void addUser(User user) {
        usersByEmail.put(user.getEmail().toLowerCase(Locale.ROOT), user);
    }

    public LoginResponse login(LoginRequest request) {
        User user = usersByEmail.get(request.getEmail().trim().toLowerCase(Locale.ROOT));

        // Validate user existence and password without revealing whether the email exists
        if (user == null || !passwordMatches(user, request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (Role.parse(request.getRole()).orElse(null) != user.getRole()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Selected role does not match this account");
        }

        purgeExpiredSessions();
        String token = UUID.randomUUID().toString();
        activeSessions.put(token, new Session(user, clock.instant().plus(sessionTtl)));

        return new LoginResponse(true, "Login successful", token, user);
    }

    public User getUserByToken(String authHeader) {
        String token = extractToken(authHeader);
        Session session = token == null ? null : activeSessions.get(token);
        if (session == null) {
            throw ApiErrors.unauthorized();
        }
        if (clock.instant().isAfter(session.expiresAt())) {
            activeSessions.remove(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired, please log in again");
        }
        return session.user();
    }

    public void logout(String authHeader) {
        String token = extractToken(authHeader);
        if (token != null) {
            activeSessions.remove(token);
        }
    }

    private void purgeExpiredSessions() {
        Instant now = clock.instant();
        activeSessions.values().removeIf(session -> now.isAfter(session.expiresAt()));
    }

    private static boolean passwordMatches(User user, String candidate) {
        // Constant-time comparison so response timing does not leak how much of the password matched.
        return MessageDigest.isEqual(user.getPassword().getBytes(StandardCharsets.UTF_8),
                candidate.getBytes(StandardCharsets.UTF_8));
    }

    private static String extractToken(String authHeader) {
        if (authHeader == null || !authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }
        String token = authHeader.substring(7).trim();
        return token.isEmpty() ? null : token;
    }
}
