package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class User {
    private final String id;
    private final String name;
    private final String email;

    @JsonIgnore
    private final String password;

    private final Role role;

    /** Id of the linked Teacher, Student or Parent record; null for admins. */
    private final String profileId;

    public User(String id, String name, String email, String password, Role role, String profileId) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.profileId = profileId;
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

    /** The id this user appears under in data they create (notice author, message sender, ...). */
    public String actorId() {
        return profileId != null ? profileId : id;
    }
}
