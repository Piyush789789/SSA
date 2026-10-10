package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** An Expo push token of a phone signed in to one of the apps. Id = the token itself. */
@Entity
@Table(indexes = @Index(name = "idx_push_recipient", columnList = "recipientId"))
public class PushToken implements Identifiable {

    @Id
    private String id;

    private String recipientId;
    private String accountId;
    private String platform;
    private LocalDateTime registeredAt;

    protected PushToken() {
    }

    public PushToken(String token, String recipientId, String accountId, String platform, LocalDateTime registeredAt) {
        this.id = token;
        this.recipientId = recipientId;
        this.accountId = accountId;
        this.platform = platform;
        this.registeredAt = registeredAt;
    }

    @Override
    public String id() {
        return id;
    }

    public String recipientId() {
        return recipientId;
    }

    public String accountId() {
        return accountId;
    }
}
