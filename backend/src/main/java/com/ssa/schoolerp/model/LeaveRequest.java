package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A leave application, for a student (applied by the student or a parent, decided by a teacher of the class or an
 * admin) or for a staff member (applied by the teacher, decided by an admin). Approval marks attendance as leave.
 */
@Entity
@Table(indexes = @Index(name = "idx_leave_person", columnList = "personId"))
@JsonFields
public class LeaveRequest implements Identifiable {

    public static final String STUDENT = "STUDENT";
    public static final String STAFF = "STAFF";
    public static final String PENDING = "PENDING";
    public static final String APPROVED = "APPROVED";
    public static final String REJECTED = "REJECTED";

    @Id
    private String id;

    private String applicantType;
    private String personId;
    private String personName;
    private String className;
    private LocalDate fromDate;
    private LocalDate toDate;

    @Column(length = 1000)
    private String reason;

    private String status;
    private String appliedById;
    private String appliedByName;
    private LocalDateTime appliedAt;
    private String reviewedByName;
    private LocalDateTime reviewedAt;

    @Column(length = 1000)
    private String reviewNote;

    protected LeaveRequest() {
    }

    public LeaveRequest(String id, String applicantType, String personId, String personName, String className,
                        LocalDate fromDate, LocalDate toDate, String reason, String status, String appliedById,
                        String appliedByName, LocalDateTime appliedAt, String reviewedByName, LocalDateTime reviewedAt,
                        String reviewNote) {
        this.id = id;
        this.applicantType = applicantType;
        this.personId = personId;
        this.personName = personName;
        this.className = className;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.reason = reason;
        this.status = status;
        this.appliedById = appliedById;
        this.appliedByName = appliedByName;
        this.appliedAt = appliedAt;
        this.reviewedByName = reviewedByName;
        this.reviewedAt = reviewedAt;
        this.reviewNote = reviewNote;
    }

    public LeaveRequest decided(String newStatus, String reviewer, LocalDateTime at, String note) {
        return new LeaveRequest(id, applicantType, personId, personName, className, fromDate, toDate, reason, newStatus,
                appliedById, appliedByName, appliedAt, reviewer, at, note);
    }

    @Override
    public String id() {
        return id;
    }

    public String applicantType() {
        return applicantType;
    }

    public String personId() {
        return personId;
    }

    public String personName() {
        return personName;
    }

    public String className() {
        return className;
    }

    public LocalDate fromDate() {
        return fromDate;
    }

    public LocalDate toDate() {
        return toDate;
    }

    public String reason() {
        return reason;
    }

    public String status() {
        return status;
    }

    public String appliedById() {
        return appliedById;
    }

    public LocalDateTime appliedAt() {
        return appliedAt;
    }
}
