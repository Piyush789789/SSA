package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * An issued certificate (Transfer Certificate or Bonafide). The student's details are copied at the moment of
 * issue so a printed certificate never changes later. The id is the certificate's serial number.
 */
@Entity
@Table(indexes = @Index(name = "idx_certificate_student", columnList = "studentId"))
@JsonFields
public class Certificate implements Identifiable {

    public static final String TRANSFER = "TC";
    public static final String BONAFIDE = "BONAFIDE";

    @Id
    private String id;

    private String type;
    private String studentId;
    private String studentName;
    private String className;
    private LocalDate dateOfBirth;
    private String guardianName;
    private LocalDate admissionDate;
    private String academicYear;
    private LocalDate issuedOn;
    private LocalDate leavingDate;
    private String reason;
    private String conduct;

    @Column(length = 1000)
    private String remarks;

    private String issuedBy;

    protected Certificate() {
    }

    public Certificate(String id, String type, String studentId, String studentName, String className,
                       LocalDate dateOfBirth, String guardianName, LocalDate admissionDate, String academicYear,
                       LocalDate issuedOn, LocalDate leavingDate, String reason, String conduct, String remarks,
                       String issuedBy) {
        this.id = id;
        this.type = type;
        this.studentId = studentId;
        this.studentName = studentName;
        this.className = className;
        this.dateOfBirth = dateOfBirth;
        this.guardianName = guardianName;
        this.admissionDate = admissionDate;
        this.academicYear = academicYear;
        this.issuedOn = issuedOn;
        this.leavingDate = leavingDate;
        this.reason = reason;
        this.conduct = conduct;
        this.remarks = remarks;
        this.issuedBy = issuedBy;
    }

    @Override
    public String id() {
        return id;
    }

    public String type() {
        return type;
    }

    public String studentId() {
        return studentId;
    }

    public LocalDate issuedOn() {
        return issuedOn;
    }
}
