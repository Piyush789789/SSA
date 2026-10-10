package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** A Razorpay order for one fee. Id = the Razorpay order id. Becomes PAID once the payment is verified. */
@Entity
@Table(indexes = @Index(name = "idx_online_payment_student", columnList = "studentId"))
@JsonFields
public class OnlinePayment implements Identifiable {

    public static final String CREATED = "CREATED";
    public static final String PAID = "PAID";

    @Id
    private String id;

    private String feeDueId;
    private String studentId;
    private long amount;
    private String status;
    private String createdByAccount;
    private LocalDateTime createdAt;
    private String gatewayPaymentId;
    private String feePaymentId;
    private LocalDateTime paidAt;

    protected OnlinePayment() {
    }

    public OnlinePayment(String id, String feeDueId, String studentId, long amount, String status,
                         String createdByAccount, LocalDateTime createdAt, String gatewayPaymentId,
                         String feePaymentId, LocalDateTime paidAt) {
        this.id = id;
        this.feeDueId = feeDueId;
        this.studentId = studentId;
        this.amount = amount;
        this.status = status;
        this.createdByAccount = createdByAccount;
        this.createdAt = createdAt;
        this.gatewayPaymentId = gatewayPaymentId;
        this.feePaymentId = feePaymentId;
        this.paidAt = paidAt;
    }

    public OnlinePayment paid(String newGatewayPaymentId, String newFeePaymentId, LocalDateTime at) {
        return new OnlinePayment(id, feeDueId, studentId, amount, PAID, createdByAccount, createdAt, newGatewayPaymentId,
                newFeePaymentId, at);
    }

    @Override
    public String id() {
        return id;
    }

    public String feeDueId() {
        return feeDueId;
    }

    public String studentId() {
        return studentId;
    }

    public long amount() {
        return amount;
    }

    public String status() {
        return status;
    }

    public String feePaymentId() {
        return feePaymentId;
    }
}
