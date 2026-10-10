package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** One change made through the API: who, when, what (method + path) and the result status. Never edited. */
@Entity
@Table(indexes = {
        @Index(name = "idx_audit_at", columnList = "at"),
        @Index(name = "idx_audit_actor", columnList = "actorId")})
@JsonFields
public class AuditEvent implements Identifiable {

    @Id
    private String id;

    private LocalDateTime at;
    private String actorId;
    private String actorName;

    private String role;
    private String method;
    private String path;
    private String action;
    private int status;

    protected AuditEvent() {
    }

    public AuditEvent(String id, LocalDateTime at, String actorId, String actorName, String role, String method,
                      String path, String action, int status) {
        this.id = id;
        this.at = at;
        this.actorId = actorId;
        this.actorName = actorName;
        this.role = role;
        this.method = method;
        this.path = path;
        this.action = action;
        this.status = status;
    }

    @Override
    public String id() {
        return id;
    }

    public LocalDateTime at() {
        return at;
    }

    public String actorId() {
        return actorId;
    }

    public String path() {
        return path;
    }

    public String action() {
        return action;
    }
}
