package com.ssa.schoolerp.model;

import java.time.LocalDate;

public record Concession(
        String id,
        String studentId,
        String feeDueId,
        String feeTitle,
        String type,
        DiscountType discountType,
        double discountValue,
        long discountAmount,
        String description,
        String approvedBy,
        LocalDate approvedOn) implements Identifiable {
}
