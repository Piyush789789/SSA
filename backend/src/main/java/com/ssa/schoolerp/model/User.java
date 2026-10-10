package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

/** The signed-in user as seen by controllers and returned by /auth/login and /auth/me. */
public class User {
    /** The account id. */
    private final String id;
    private final String name;
    /** The login (email or ID). */
    private final String email;

    @JsonIgnore
    private final String password;

    private final Role role;

    /** Id of the linked Teacher, Student or Parent record; null for admins. */
    private final String profileId;

    /** True after an admin set a temporary password: the apps ask for a new one before anything else. */
    private final boolean mustChangePassword;

    public User(String id, String name, String email, String password, Role role, String profileId) {
        this(id, name, email, password, role, profileId, false);
    }

    /** For limited staff logins: the modules they may change. Empty = everything their role allows. */
    private final java.util.Set<Permission> permissions;

    /** Job title of a staff login, e.g. "Accountant"; null otherwise. */
    private final String staffTitle;

    public User(String id, String name, String email, String password, Role role, String profileId,
                boolean mustChangePassword) {
        this(id, name, email, password, role, profileId, mustChangePassword, java.util.Set.of(), null);
    }

    public User(String id, String name, String email, String password, Role role, String profileId,
                boolean mustChangePassword, java.util.Set<Permission> permissions, String staffTitle) {
        this.permissions = permissions == null ? java.util.Set.of() : java.util.Set.copyOf(permissions);
        this.staffTitle = staffTitle;
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.profileId = profileId;
        this.mustChangePassword = mustChangePassword;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public Role getRole() {
        return role;
    }

    public String getProfileId() {
        return profileId;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public java.util.Set<Permission> getPermissions() {
        return permissions;
    }

    public String getStaffTitle() {
        return staffTitle;
    }

    /** A full admin: role ADMIN without a limited permission list. */
    @JsonIgnore
    public boolean isFullAdmin() {
        return role == Role.ADMIN && permissions.isEmpty();
    }

    /** True when this user may change things in that module (full admins may change everything). */
    public boolean can(Permission permission) {
        return role == Role.ADMIN && (permissions.isEmpty() || permissions.contains(permission));
    }

    /** The id this user appears under in data they create (notice author, message sender, ...). */
    public String actorId() {
        return profileId != null ? profileId : id;
    }
}
