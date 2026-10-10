package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(indexes = @Index(name = "idx_payment_student", columnList = "studentId"))
@JsonFields
public class FeePayment implements Identifiable {

    @Id
    private String id;

    private String receiptNo;
    private String studentId;
    private String studentName;
    private String className;
    private String feeDueId;
    private String feeTitle;
    private long amount;
    private String paymentMode;
    private LocalDateTime paidAt;
    private String remarks;
    private String collectedBy;

    protected FeePayment() {
    }

    public FeePayment(String id, String receiptNo, String studentId, String studentName, String className,
                      String feeDueId, String feeTitle, long amount, String paymentMode, LocalDateTime paidAt,
                      String remarks, String collectedBy) {
        this.id = id;
        this.receiptNo = receiptNo;
        this.studentId = studentId;
        this.studentName = studentName;
        this.className = className;
        this.feeDueId = feeDueId;
        this.feeTitle = feeTitle;
        this.amount = amount;
        this.paymentMode = paymentMode;
        this.paidAt = paidAt;
        this.remarks = remarks;
        this.collectedBy = collectedBy;
    }

    @Override
    public String id() {
        return id;
    }

    public String receiptNo() {
        return receiptNo;
    }

    public String studentId() {
        return studentId;
    }

    public String studentName() {
        return studentName;
    }

    public String className() {
        return className;
    }

    public String feeDueId() {
        return feeDueId;
    }

    public String feeTitle() {
        return feeTitle;
    }

    public long amount() {
        return amount;
    }

    public String paymentMode() {
        return paymentMode;
    }

    public LocalDateTime paidAt() {
        return paidAt;
    }

    public String remarks() {
        return remarks;
    }

    public String collectedBy() {
        return collectedBy;
    }
}
