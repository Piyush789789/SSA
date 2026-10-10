package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * A signed-in session. The id is the SHA-256 hash of the token, so a leaked database copy does not
 * reveal usable tokens. Stored in the database so restarts do not sign everyone out.
 */
@Entity
@Table(indexes = @Index(name = "idx_session_account", columnList = "accountId"))
public class AuthSession implements Identifiable {

    @Id
    private String id;

    private String accountId;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    protected AuthSession() {
    }

    public AuthSession(String id, String accountId, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.id = id;
        this.accountId = accountId;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    @Override
    public String id() {
        return id;
    }

    public String accountId() {
        return accountId;
    }

    public LocalDateTime expiresAt() {
        return expiresAt;
    }
}
