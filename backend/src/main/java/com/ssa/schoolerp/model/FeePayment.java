package com.ssa.schoolerp.model;

import java.time.LocalDateTime;

public record FeePayment(
        String id,
        String receiptNo,
        String studentId,
        String studentName,
        String className,
        String feeDueId,
        String feeTitle,
        long amount,
        String paymentMode,
        LocalDateTime paidAt,
        String remarks,
        String collectedBy) implements Identifiable {
}
