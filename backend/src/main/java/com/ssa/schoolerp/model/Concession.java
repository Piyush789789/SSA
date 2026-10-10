package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

import java.time.LocalDate;

@Entity
@JsonFields
public class Concession implements Identifiable {

    @Id
    private String id;

    private String studentId;
    private String feeDueId;
    private String feeTitle;
    private String type;

    @Enumerated(EnumType.STRING)
    private DiscountType discountType;

    private double discountValue;
    private long discountAmount;

    @Column(length = 2000)
    private String description;

    private String approvedBy;
    private LocalDate approvedOn;

    protected Concession() {
    }

    public Concession(String id, String studentId, String feeDueId, String feeTitle, String type,
                      DiscountType discountType, double discountValue, long discountAmount, String description,
                      String approvedBy, LocalDate approvedOn) {
        this.id = id;
        this.studentId = studentId;
        this.feeDueId = feeDueId;
        this.feeTitle = feeTitle;
        this.type = type;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.discountAmount = discountAmount;
        this.description = description;
        this.approvedBy = approvedBy;
        this.approvedOn = approvedOn;
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

    public String feeTitle() {
        return feeTitle;
    }

    public String type() {
        return type;
    }

    public DiscountType discountType() {
        return discountType;
    }

    public double discountValue() {
        return discountValue;
    }

    public long discountAmount() {
        return discountAmount;
    }

    public String description() {
        return description;
    }

    public String approvedBy() {
        return approvedBy;
    }

    public LocalDate approvedOn() {
        return approvedOn;
    }
}
