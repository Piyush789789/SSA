package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A fee payment reported by a student or parent (e.g. a UPI transfer). It only counts towards the fee once
 * an admin has checked it and approved it, which records a {@link FeePayment}.
 */
@Entity
@Table(indexes = @Index(name = "idx_deposit_student", columnList = "studentId"))
@JsonFields
public class FeeDeposit implements Identifiable {

    public enum Status { PENDING, APPROVED, REJECTED }

    @Id
    private String id;

    private String studentId;
    private String studentName;
    private String className;
    private String feeDueId;
    private String feeTitle;
    private long amount;
    private String paymentMode;
    private String referenceNo;
    private LocalDate paidOn;

    @Column(length = 1000)
    private String note;

    @Enumerated(EnumType.STRING)
    private Status status;

    private String submittedBy;
    private LocalDateTime submittedAt;
    private String reviewedBy;
    private LocalDateTime reviewedAt;

    @Column(length = 1000)
    private String reviewNote;

    /** The payment created on approval. */
    private String paymentId;

    protected FeeDeposit() {
    }

    public FeeDeposit(String id, String studentId, String studentName, String className, String feeDueId,
                      String feeTitle, long amount, String paymentMode, String referenceNo, LocalDate paidOn,
                      String note, Status status, String submittedBy, LocalDateTime submittedAt, String reviewedBy,
                      LocalDateTime reviewedAt, String reviewNote, String paymentId) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.className = className;
        this.feeDueId = feeDueId;
        this.feeTitle = feeTitle;
        this.amount = amount;
        this.paymentMode = paymentMode;
        this.referenceNo = referenceNo;
        this.paidOn = paidOn;
        this.note = note;
        this.status = status;
        this.submittedBy = submittedBy;
        this.submittedAt = submittedAt;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
        this.reviewNote = reviewNote;
        this.paymentId = paymentId;
    }

    public FeeDeposit reviewed(Status newStatus, String reviewer, LocalDateTime at, String comment, String newPaymentId) {
        return new FeeDeposit(id, studentId, studentName, className, feeDueId, feeTitle, amount, paymentMode,
                referenceNo, paidOn, note, newStatus, submittedBy, submittedAt, reviewer, at, comment, newPaymentId);
    }

    @Override
    public String id() {
        return id;
    }

    public String studentId() {
        return studentId;
    }

    public String feeDueId() {
        return feeDueId;
    }

    public long amount() {
        return amount;
    }

    public String paymentMode() {
        return paymentMode;
    }

    public String referenceNo() {
        return referenceNo;
    }

    public LocalDate paidOn() {
        return paidOn;
    }

    public Status status() {
        return status;
    }

    public LocalDateTime submittedAt() {
        return submittedAt;
    }
}
