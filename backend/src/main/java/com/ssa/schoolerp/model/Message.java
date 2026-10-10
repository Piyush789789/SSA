package com.ssa.schoolerp.model;

import java.time.LocalDateTime;

/**
 * A message between school and families. CLASS messages go to every family in {@code className};
 * STUDENT messages go privately to one student and their parents; TEACHER messages go to one teacher.
 */
public record Message(
        String id,
        String senderId,
        String senderName,
        Role senderRole,
        RecipientType recipientType,
        String className,
        String recipientId,
        String recipientName,
        String subject,
        String body,
        LocalDateTime sentAt) implements Identifiable {
}
