package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * A login. {@code loginId} is an email or an ID such as a student's admission number; the linked
 * Teacher/Student/Parent record is {@code profileId} (null for admins). Passwords are stored as BCrypt hashes.
 */
@Entity
@Table(indexes = {
        @Index(name = "idx_account_login", columnList = "loginId", unique = true),
        @Index(name = "idx_account_profile", columnList = "profileId")})
@JsonFields
public class UserAccount implements Identifiable {

    @Id
    private String id;

    @Column(nullable = false)
    private String loginId;

    @JsonIgnore
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String profileId;
    private String displayName;
    private boolean active;
    private boolean mustChangePassword;
    private int failedAttempts;
    private LocalDateTime lockedUntil;
    private LocalDateTime lastLoginAt;

    /** Staff logins (role ADMIN) limited to some modules: comma-separated {@link Permission} names; null = full admin. */
    private String permissions;

    /** Job title of a staff login, e.g. "Accountant". */
    private String staffTitle;

    protected UserAccount() {
    }

    public UserAccount(String id, String loginId, String passwordHash, Role role, String profileId, String displayName,
                       boolean active, boolean mustChangePassword, int failedAttempts, LocalDateTime lockedUntil,
                       LocalDateTime lastLoginAt) {
        this.id = id;
        this.loginId = loginId;
        this.passwordHash = passwordHash;
        this.role = role;
        this.profileId = profileId;
        this.displayName = displayName;
        this.active = active;
        this.mustChangePassword = mustChangePassword;
        this.failedAttempts = failedAttempts;
        this.lockedUntil = lockedUntil;
        this.lastLoginAt = lastLoginAt;
    }

    public UserAccount withStaffRole(String newStaffTitle, java.util.Collection<Permission> newPermissions) {
        UserAccount copy = copy();
        copy.staffTitle = newStaffTitle;
        copy.permissions = newPermissions == null || newPermissions.isEmpty() ? null
                : newPermissions.stream().map(Enum::name).sorted().collect(java.util.stream.Collectors.joining(","));
        return copy;
    }

    private UserAccount copy() {
        UserAccount copy = new UserAccount(id, loginId, passwordHash, role, profileId, displayName, active,
                mustChangePassword, failedAttempts, lockedUntil, lastLoginAt);
        copy.permissions = permissions;
        copy.staffTitle = staffTitle;
        return copy;
    }

    public UserAccount withPassword(String newHash, boolean mustChange) {
        return keepStaff(new UserAccount(id, loginId, newHash, role, profileId, displayName, active, mustChange, 0, null,
                lastLoginAt));
    }

    public UserAccount withLoginResult(int newFailedAttempts, LocalDateTime newLockedUntil, LocalDateTime newLastLoginAt) {
        return keepStaff(new UserAccount(id, loginId, passwordHash, role, profileId, displayName, active, mustChangePassword,
                newFailedAttempts, newLockedUntil, newLastLoginAt));
    }

    public UserAccount withActive(boolean newActive) {
        return keepStaff(new UserAccount(id, loginId, passwordHash, role, profileId, displayName, newActive, mustChangePassword,
                0, null, lastLoginAt));
    }

    public UserAccount withDisplayName(String newName) {
        return keepStaff(new UserAccount(id, loginId, passwordHash, role, profileId, newName, active, mustChangePassword,
                failedAttempts, lockedUntil, lastLoginAt));
    }

    private UserAccount keepStaff(UserAccount next) {
        next.permissions = permissions;
        next.staffTitle = staffTitle;
        return next;
    }

    /** The principal handed to controllers for this account. */
    public User toUser() {
        return new User(id, displayName, loginId, null, role, profileId, mustChangePassword, permissionSet(), staffTitle);
    }

    @Override
    public String id() {
        return id;
    }

    public String loginId() {
        return loginId;
    }

    public String passwordHash() {
        return passwordHash;
    }

    public Role role() {
        return role;
    }

    public String profileId() {
        return profileId;
    }

    public String displayName() {
        return displayName;
    }

    public boolean active() {
        return active;
    }

    public boolean mustChangePassword() {
        return mustChangePassword;
    }

    public int failedAttempts() {
        return failedAttempts;
    }

    public LocalDateTime lockedUntil() {
        return lockedUntil;
    }

    public LocalDateTime lastLoginAt() {
        return lastLoginAt;
    }

    public String staffTitle() {
        return staffTitle;
    }

    /** Empty for a full admin (and for every non-admin login). */
    public java.util.Set<Permission> permissionSet() {
        if (permissions == null || permissions.isBlank()) return java.util.Set.of();
        java.util.Set<Permission> set = java.util.EnumSet.noneOf(Permission.class);
        for (String p : permissions.split(",")) {
            try {
                set.add(Permission.valueOf(p.trim()));
            } catch (IllegalArgumentException ignored) {
                // a permission that no longer exists
            }
        }
        return set;
    }
}
