package com.ssa.schoolerp.model;

import java.time.LocalDate;

/** What one student owes for one fee head. Amounts are whole rupees. */
public record FeeDue(
        String id,
        String studentId,
        String feeHeadId,
        String title,
        long amount,
        long concession,
        long paid,
        LocalDate dueDate) implements Identifiable {

    public static String idFor(String studentId, String feeHeadId) {
        return "DUE-" + studentId + "-" + feeHeadId;
    }

    public long payable() {
        return amount - concession;
    }

    public long pending() {
        return Math.max(0, payable() - paid);
    }

    public FeeDue withPaid(long newPaid) {
        return new FeeDue(id, studentId, feeHeadId, title, amount, concession, newPaid, dueDate);
    }

    public FeeDue withConcession(long newConcession) {
        return new FeeDue(id, studentId, feeHeadId, title, amount, newConcession, paid, dueDate);
    }

    public FeeDue withHeadDetails(String newTitle, long newAmount, LocalDate newDueDate) {
        return new FeeDue(id, studentId, feeHeadId, newTitle, newAmount, concession, paid, newDueDate);
    }
}
