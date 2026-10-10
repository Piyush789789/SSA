package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.AccountDtos.AccountView;
import com.ssa.schoolerp.dto.AccountDtos.ActiveRequest;
import com.ssa.schoolerp.dto.AccountDtos.CreateAccountRequest;
import com.ssa.schoolerp.dto.AccountDtos.ParentRequest;
import com.ssa.schoolerp.dto.AccountDtos.PermissionOption;
import com.ssa.schoolerp.dto.AccountDtos.StaffAccountRequest;
import com.ssa.schoolerp.dto.AccountDtos.StaffRoleRequest;
import com.ssa.schoolerp.dto.AccountDtos.TemporaryPassword;
import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.AccountService;
import jakarta.validation.Valid;
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

import java.util.List;

/** Logins and parent records, managed by admins. */
@RestController
@RequestMapping("/api")
@RequireRole(Role.ADMIN)
public class AccountController {

    private final AccountService accounts;

    public AccountController(AccountService accounts) {
        this.accounts = accounts;
    }

    @GetMapping("/accounts")
    public ApiResponse<List<AccountView>> list(@RequestParam(required = false) Role role) {
        return ApiResponse.of(accounts.list(role));
    }

    /** Creates a login with a temporary password, returned only in this response. */
    @PostMapping("/accounts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TemporaryPassword> create(@Valid @RequestBody CreateAccountRequest request) {
        return ApiResponse.success("Login created", accounts.create(request));
    }

    /** A login for office staff, limited to some modules (no permissions = full administrator). */
    @PostMapping("/accounts/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TemporaryPassword> createStaff(@Valid @RequestBody StaffAccountRequest request) {
        return ApiResponse.success("Staff login created", accounts.createStaff(request));
    }

    @PutMapping("/accounts/{id}/staff-role")
    public ApiResponse<AccountView> updateStaffRole(@CurrentUser User admin, @PathVariable String id,
                                                    @Valid @RequestBody StaffRoleRequest request) {
        return ApiResponse.success("Staff role updated", accounts.updateStaffRole(admin, id, request));
    }

    @GetMapping("/accounts/permissions")
    public ApiResponse<List<PermissionOption>> permissions() {
        return ApiResponse.of(accounts.permissionOptions());
    }

    @PostMapping("/accounts/{id}/reset-password")
    public ApiResponse<TemporaryPassword> resetPassword(@PathVariable String id) {
        return ApiResponse.success("Password reset", accounts.resetPassword(id));
    }

    @PutMapping("/accounts/{id}/active")
    public ApiResponse<AccountView> setActive(@CurrentUser User admin, @PathVariable String id,
                                              @RequestBody ActiveRequest request) {
        return ApiResponse.success(request.active() ? "Account enabled" : "Account disabled",
                accounts.setActive(admin, id, request.active()));
    }

    @GetMapping("/parents")
    public ApiResponse<List<Parent>> parents() {
        return ApiResponse.of(accounts.parents());
    }

    @PostMapping("/parents")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Parent> createParent(@Valid @RequestBody ParentRequest request) {
        return ApiResponse.success("Parent added", accounts.createParent(request));
    }

    @PutMapping("/parents/{id}")
    public ApiResponse<Parent> updateParent(@PathVariable String id, @Valid @RequestBody ParentRequest request) {
        return ApiResponse.success("Parent updated", accounts.updateParent(id, request));
    }

    @DeleteMapping("/parents/{id}")
    public ApiResponse<Void> deleteParent(@PathVariable String id) {
        accounts.deleteParent(id);
        return ApiResponse.success("Parent removed");
    }
}
