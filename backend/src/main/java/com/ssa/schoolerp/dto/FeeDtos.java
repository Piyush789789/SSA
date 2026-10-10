package com.ssa.schoolerp.dto;

import com.ssa.schoolerp.model.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public final class FeeDtos {

    private FeeDtos() {
    }

    public record AssignRequest(@NotBlank String studentId, @NotBlank String feeHeadId) {
    }

    public record PaymentRequest(
            @NotBlank String feeDueId,
            @Positive long amount,
            @NotBlank String paymentMode,
            String remarks) {
    }

    public record ConcessionRequest(
            @NotBlank String feeDueId,
            @NotBlank String type,
            @NotNull DiscountType discountType,
            @Positive double discountValue,
            String description) {
    }

    /** A fee due with its derived figures. Status is one of Paid, Partial, Overdue, Pending. */
    public record DueView(
            String id,
            String studentId,
            String studentName,
            String className,
            String feeHeadId,
            String title,
            long amount,
            long concession,
            long paid,
            long pending,
            LocalDate dueDate,
            String status) {
    }

    public record StudentSummary(
            String studentId,
            String studentName,
            String className,
            long total,
            long concession,
            long paid,
            long pending,
            long overdue,
            List<DueView> dues) {
    }

    public record Overview(
            String className,
            long expected,
            long concessions,
            long collected,
            long pending,
            long overdue,
            long collectedToday,
            int paymentsToday,
            int fullyPaidStudents,
            int studentsWithDues) {
    }
}
