package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * An in-app alert for one person. {@code recipientId} is the person's profile id (teacher/student/parent)
 * or the account id for admins — the same id as {@link User#actorId()}.
 */
@Entity
@Table(indexes = @Index(name = "idx_notification_recipient", columnList = "recipientId, createdAt"))
@JsonFields
public class Notification implements Identifiable {

    @Id
    private String id;

    private String recipientId;
    private String title;

    @Column(length = 1000)
    private String body;

    /** ATTENDANCE, FEES, FEE_REMINDER, RESULTS, HOMEWORK, NOTICE, MESSAGE, LEAVE … */
    private String category;

    /** Where the apps should open, e.g. "/fees". */
    private String link;

    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    protected Notification() {
    }

    public Notification(String id, String recipientId, String title, String body, String category, String link,
                        LocalDateTime createdAt, LocalDateTime readAt) {
        this.id = id;
        this.recipientId = recipientId;
        this.title = title;
        this.body = body;
        this.category = category;
        this.link = link;
        this.createdAt = createdAt;
        this.readAt = readAt;
    }

    public Notification markedRead(LocalDateTime at) {
        return new Notification(id, recipientId, title, body, category, link, createdAt, at);
    }

    @Override
    public String id() {
        return id;
    }

    public String recipientId() {
        return recipientId;
    }

    public LocalDateTime readAt() {
        return readAt;
    }
}
