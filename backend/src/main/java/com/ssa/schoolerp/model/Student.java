package com.ssa.schoolerp.model;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

@Entity
@JsonFields
public class Student implements Identifiable {

    @Id
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    private String className;

    @Positive
    private Integer rollNumber;

    @Pattern(regexp = "Male|Female|Other")
    private String gender;

    @Past
    private LocalDate dateOfBirth;

    private String bloodGroup;

    @Email
    private String email;

    private String address;
    private LocalDate admissionDate;

    @Valid
    @Embedded
    @AttributeOverride(name = "name", column = @Column(name = "guardian_name"))
    @AttributeOverride(name = "relation", column = @Column(name = "guardian_relation"))
    @AttributeOverride(name = "phone", column = @Column(name = "guardian_phone"))
    @AttributeOverride(name = "email", column = @Column(name = "guardian_email"))
    private Guardian guardian;

    protected Student() {
    }

    public Student(String id, String name, String className, Integer rollNumber, String gender, LocalDate dateOfBirth,
                   String bloodGroup, String email, String address, LocalDate admissionDate, Guardian guardian) {
        this.id = id;
        this.name = name;
        this.className = className;
        this.rollNumber = rollNumber;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.bloodGroup = bloodGroup;
        this.email = email;
        this.address = address;
        this.admissionDate = admissionDate;
        this.guardian = guardian;
    }

    public Student withIdAndRollNumber(String newId, int newRollNumber) {
        return new Student(newId, name, className, newRollNumber, gender, dateOfBirth, bloodGroup, email,
                address, admissionDate, guardian);
    }

    @Override
    public String id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String className() {
        return className;
    }

    public Integer rollNumber() {
        return rollNumber;
    }

    public String gender() {
        return gender;
    }

    public LocalDate dateOfBirth() {
        return dateOfBirth;
    }

    public String bloodGroup() {
        return bloodGroup;
    }

    public String email() {
        return email;
    }

    public String address() {
        return address;
    }

    public LocalDate admissionDate() {
        return admissionDate;
    }

    public Guardian guardian() {
        return guardian;
    }
}
