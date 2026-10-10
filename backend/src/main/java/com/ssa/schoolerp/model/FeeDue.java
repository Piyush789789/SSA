package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;

/** What one student owes for one fee head. Amounts are whole rupees. */
@Entity
@Table(indexes = @Index(name = "idx_fee_due_student", columnList = "studentId"))
@JsonFields
public class FeeDue implements Identifiable {

    @Id
    private String id;

    private String studentId;
    private String feeHeadId;
    private String title;
    private long amount;
    private long concession;
    private long paid;
    private LocalDate dueDate;

    protected FeeDue() {
    }

    public FeeDue(String id, String studentId, String feeHeadId, String title, long amount, long concession, long paid,
                  LocalDate dueDate) {
        this.id = id;
        this.studentId = studentId;
        this.feeHeadId = feeHeadId;
        this.title = title;
        this.amount = amount;
        this.concession = concession;
        this.paid = paid;
        this.dueDate = dueDate;
    }

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

    @Override
    public String id() {
        return id;
    }

    public String studentId() {
        return studentId;
    }

    public String feeHeadId() {
        return feeHeadId;
    }

    public String title() {
        return title;
    }

    public long amount() {
        return amount;
    }

    public long concession() {
        return concession;
    }

    public long paid() {
        return paid;
    }

    public LocalDate dueDate() {
        return dueDate;
    }
}
