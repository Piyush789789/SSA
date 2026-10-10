package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.AccountDtos.ChangePasswordRequest;
import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.LoginResponse;
import com.ssa.schoolerp.model.LoginRequest;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.AccessGuard;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.PublicEndpoint;
import com.ssa.schoolerp.service.AccountService;
import com.ssa.schoolerp.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /** Forgot-password requests allowed per connection per hour (stops someone flooding the admins). */
    private static final int RESET_REQUESTS_PER_HOUR = 5;

    private final AuthService authService;
    private final AccessGuard guard;
    private final AccountService accounts;
    private final java.time.Clock clock;
    private final Map<String, java.util.Deque<java.time.Instant>> resetRequestsByIp =
            new java.util.concurrent.ConcurrentHashMap<>();

    public AuthController(AuthService authService, AccessGuard guard, AccountService accounts, java.time.Clock clock) {
        this.authService = authService;
        this.guard = guard;
        this.accounts = accounts;
        this.clock = clock;
    }

    public record ForgotPasswordRequest(@jakarta.validation.constraints.NotBlank String loginId) {
    }

    /** Asks the school office to reset a password. Same answer whether or not the login exists. */
    @PublicEndpoint
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                                            jakarta.servlet.http.HttpServletRequest http) {
        java.time.Instant now = clock.instant();
        java.util.Deque<java.time.Instant> times = resetRequestsByIp.computeIfAbsent(
                String.valueOf(http.getRemoteAddr()), k -> new java.util.ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst().isBefore(now.minusSeconds(3600))) times.pollFirst();
            if (times.size() >= RESET_REQUESTS_PER_HOUR) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                        "Too many requests; please contact the school office");
            }
            times.addLast(now);
        }
        accounts.requestPasswordReset(request.loginId());
        return ResponseEntity.ok(ApiResponse.success(
                "If this login exists, the school office has been asked to reset the password. They will give you a new one."));
    }

    @PublicEndpoint
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /** The signed-in user plus their teacher/student/parent record (parents also get their children). */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@CurrentUser User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("user", user);
        switch (user.getRole()) {
            case TEACHER -> response.put("profile", guard.teacherOf(user));
            case STUDENT -> response.put("profile", guard.studentOf(user));
            case PARENT -> {
                response.put("profile", guard.parentOf(user));
                response.put("children", guard.childrenOf(user));
            }
            case ADMIN -> {
                // admins have no profile record
            }
        }
        return ResponseEntity.ok(response);
    }

    /** Any signed-in user; also how a temporary password is replaced at first login. */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@CurrentUser User user,
                                                            @Valid @RequestBody ChangePasswordRequest request,
                                                            @RequestHeader("Authorization") String authHeader) {
        authService.changePassword(user, request.currentPassword(), request.newPassword(), authHeader);
        return ResponseEntity.ok(ApiResponse.success("Password changed"));
    }

    @PublicEndpoint
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.logout(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
}
