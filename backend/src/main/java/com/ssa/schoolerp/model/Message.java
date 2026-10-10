package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

import java.time.LocalDateTime;

/**
 * A message between school and families. CLASS messages go to every family in {@code className};
 * STUDENT messages go privately to one student and their parents; TEACHER messages go to one teacher.
 */
@Entity
@JsonFields
public class Message implements Identifiable {

    @Id
    private String id;

    private String senderId;
    private String senderName;

    @Enumerated(EnumType.STRING)
    private Role senderRole;

    @Enumerated(EnumType.STRING)
    private RecipientType recipientType;

    private String className;
    private String recipientId;
    private String recipientName;
    private String subject;

    @Column(length = 4000)
    private String body;

    private LocalDateTime sentAt;

    protected Message() {
    }

    public Message(String id, String senderId, String senderName, Role senderRole, RecipientType recipientType,
                   String className, String recipientId, String recipientName, String subject, String body,
                   LocalDateTime sentAt) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.recipientType = recipientType;
        this.className = className;
        this.recipientId = recipientId;
        this.recipientName = recipientName;
        this.subject = subject;
        this.body = body;
        this.sentAt = sentAt;
    }

    @Override
    public String id() {
        return id;
    }

    public String senderId() {
        return senderId;
    }

    public String senderName() {
        return senderName;
    }

    public Role senderRole() {
        return senderRole;
    }

    public RecipientType recipientType() {
        return recipientType;
    }

    public String className() {
        return className;
    }

    public String recipientId() {
        return recipientId;
    }

    public String recipientName() {
        return recipientName;
    }

    public String subject() {
        return subject;
    }

    public String body() {
        return body;
    }

    public LocalDateTime sentAt() {
        return sentAt;
    }
}
