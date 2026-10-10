package com.ssa.schoolerp.dto;

import com.ssa.schoolerp.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class AccountDtos {

    private AccountDtos() {
    }

    /**
     * A person who can have a login, with the login's state. {@code accountId} is null when no login exists yet.
     * {@code detail} is the class for students, subjects for teachers, children for parents.
     */
    public record AccountView(
            String accountId,
            String loginId,
            Role role,
            String profileId,
            String name,
            String detail,
            boolean active,
            boolean mustChangePassword,
            LocalDateTime lastLoginAt,
            String staffTitle,
            java.util.Set<com.ssa.schoolerp.model.Permission> permissions) {
    }

    /**
     * A staff login (office staff, accountant, librarian...): an admin account limited to some modules. An empty
     * {@code permissions} list makes a full administrator.
     */
    public record StaffAccountRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(max = 100) String loginId,
            @Size(max = 60) String staffTitle,
            java.util.Set<com.ssa.schoolerp.model.Permission> permissions) {
    }

    public record StaffRoleRequest(@Size(max = 60) String staffTitle,
                                   java.util.Set<com.ssa.schoolerp.model.Permission> permissions) {
    }

    public record PermissionOption(com.ssa.schoolerp.model.Permission id, String label) {
    }

    /** {@code loginId} is optional: by default the person's email, or their ID if they have no email. */
    public record CreateAccountRequest(@NotNull Role role, String profileId, String loginId) {
    }

    /** Returned once when a login is created or a password is reset; the admin hands it to the person. */
    public record TemporaryPassword(AccountView account, String temporaryPassword) {
    }

    public record ActiveRequest(boolean active) {
    }

    public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank String newPassword) {
    }

    public record ParentRequest(
            @NotBlank @Size(max = 100) String name,
            @Email String email,
            @Size(max = 30) String phone,
            @Size(max = 30) String relation,
            List<String> childIds) {
    }
}
