package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * School-wide details printed on certificates and report cards, and the current academic year. One row, id "school".
 */
@Entity
@JsonFields
public class SchoolSettings implements Identifiable {

    public static final String ID = "school";

    @Id
    private String id = ID;

    @NotBlank
    private String schoolName;

    private String address;
    private String phone;
    private String email;
    private String board;
    private String affiliationNo;
    private String udiseCode;
    private String principalName;

    @NotBlank
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Academic year must look like 2026-27")
    private String currentAcademicYear;

    protected SchoolSettings() {
    }

    public SchoolSettings(String schoolName, String address, String phone, String email, String board,
                          String affiliationNo, String udiseCode, String principalName, String currentAcademicYear) {
        this.schoolName = schoolName;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.board = board;
        this.affiliationNo = affiliationNo;
        this.udiseCode = udiseCode;
        this.principalName = principalName;
        this.currentAcademicYear = currentAcademicYear;
    }

    public SchoolSettings withAcademicYear(String year) {
        return new SchoolSettings(schoolName, address, phone, email, board, affiliationNo, udiseCode, principalName, year);
    }

    @Override
    public String id() {
        return ID;
    }

    public String schoolName() {
        return schoolName;
    }

    public String address() {
        return address;
    }

    public String phone() {
        return phone;
    }

    public String email() {
        return email;
    }

    public String board() {
        return board;
    }

    public String affiliationNo() {
        return affiliationNo;
    }

    public String udiseCode() {
        return udiseCode;
    }

    public String principalName() {
        return principalName;
    }

    public String currentAcademicYear() {
        return currentAcademicYear;
    }
}
