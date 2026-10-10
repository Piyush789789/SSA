package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.AccountDtos.ChangePasswordRequest;
import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.LoginResponse;
import com.ssa.schoolerp.model.LoginRequest;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.AccessGuard;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.PublicEndpoint;
import com.ssa.schoolerp.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AccessGuard guard;

    public AuthController(AuthService authService, AccessGuard guard) {
        this.authService = authService;
        this.guard = guard;
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
