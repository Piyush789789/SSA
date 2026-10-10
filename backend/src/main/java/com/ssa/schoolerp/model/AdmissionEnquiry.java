package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A prospective admission, from the website form, a phone call or a walk-in. Moves through the pipeline
 * NEW → CONTACTED → VISITED → APPLIED → ADMITTED (or CLOSED); admitting it creates the student.
 */
@Entity
@Table(indexes = @Index(name = "idx_enquiry_status", columnList = "status"))
@JsonFields
public class AdmissionEnquiry implements Identifiable {

    public static final String NEW = "NEW";
    public static final String ADMITTED = "ADMITTED";
    public static final String CLOSED = "CLOSED";
    public static final String STATUSES = "NEW|CONTACTED|VISITED|APPLIED|ADMITTED|CLOSED";

    @Id
    private String id;

    @NotBlank
    @Size(max = 100)
    private String studentName;

    private LocalDate dateOfBirth;

    @Pattern(regexp = "Male|Female|Other")
    private String gender;

    /** Grade sought, e.g. "5" or "Nursery". */
    @NotBlank
    @Size(max = 20)
    private String classSought;

    @NotBlank
    @Size(max = 100)
    private String parentName;

    @NotBlank
    @Pattern(regexp = "[+0-9 ()-]{7,20}", message = "must be a phone number")
    private String phone;

    @Email
    private String email;

    @Size(max = 300)
    private String address;

    @Size(max = 100)
    private String previousSchool;

    /** Website, Walk-in, Phone, Referral, Social media, ... */
    @Size(max = 40)
    private String source;

    @Pattern(regexp = STATUSES)
    private String status;

    private LocalDate followUpDate;

    @Column(length = 2000)
    @Size(max = 2000)
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String admittedStudentId;

    protected AdmissionEnquiry() {
    }

    public AdmissionEnquiry withSystemFields(String newId, String newStatus, LocalDateTime created, LocalDateTime updated,
                                             String studentId) {
        AdmissionEnquiry copy = copy();
        copy.id = newId;
        copy.status = newStatus;
        copy.createdAt = created;
        copy.updatedAt = updated;
        copy.admittedStudentId = studentId;
        return copy;
    }

    public AdmissionEnquiry withSource(String newSource) {
        AdmissionEnquiry copy = copy();
        copy.source = newSource;
        return copy;
    }

    public AdmissionEnquiry withFollowUp(LocalDate newFollowUp, String newNotes) {
        AdmissionEnquiry copy = copy();
        copy.followUpDate = newFollowUp;
        if (newNotes != null) copy.notes = newNotes;
        return copy;
    }

    private AdmissionEnquiry copy() {
        AdmissionEnquiry c = new AdmissionEnquiry();
        c.id = id;
        c.studentName = studentName == null ? null : studentName.trim();
        c.dateOfBirth = dateOfBirth;
        c.gender = gender;
        c.classSought = classSought == null ? null : classSought.trim();
        c.parentName = parentName == null ? null : parentName.trim();
        c.phone = phone == null ? null : phone.trim();
        c.email = email;
        c.address = address;
        c.previousSchool = previousSchool;
        c.source = source;
        c.status = status;
        c.followUpDate = followUpDate;
        c.notes = notes;
        c.createdAt = createdAt;
        c.updatedAt = updatedAt;
        c.admittedStudentId = admittedStudentId;
        return c;
    }

    @Override
    public String id() {
        return id;
    }

    public String studentName() {
        return studentName;
    }

    public LocalDate dateOfBirth() {
        return dateOfBirth;
    }

    public String gender() {
        return gender;
    }

    public String classSought() {
        return classSought;
    }

    public String parentName() {
        return parentName;
    }

    public String phone() {
        return phone;
    }

    public String email() {
        return email;
    }

    public String address() {
        return address;
    }

    public String status() {
        return status;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    public String admittedStudentId() {
        return admittedStudentId;
    }
}
