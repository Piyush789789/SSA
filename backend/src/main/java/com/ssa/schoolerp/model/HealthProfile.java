package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** A student's medical details for the school nurse and emergencies. Id = studentId. */
@Entity
@JsonFields
public class HealthProfile implements Identifiable {

    @Id
    private String id;

    @DecimalMin("30") @DecimalMax("220")
    private Double heightCm;

    @DecimalMin("5") @DecimalMax("200")
    private Double weightKg;

    @Size(max = 10)
    private String bloodGroup;

    @Size(max = 20)
    private String visionLeft;

    @Size(max = 20)
    private String visionRight;

    @Column(length = 1000)
    @Size(max = 1000)
    private String allergies;

    @Column(length = 1000)
    @Size(max = 1000)
    private String conditions;

    @Column(length = 1000)
    @Size(max = 1000)
    private String medications;

    @Size(max = 100)
    private String emergencyContactName;

    @Size(max = 20)
    private String emergencyContactPhone;

    @Size(max = 100)
    private String familyDoctor;

    private LocalDate lastCheckupDate;
    private String updatedBy;
    private LocalDateTime updatedAt;

    protected HealthProfile() {
    }

    public HealthProfile forStudent(String studentId, String by, LocalDateTime at) {
        HealthProfile c = new HealthProfile();
        c.id = studentId;
        c.heightCm = heightCm;
        c.weightKg = weightKg;
        c.bloodGroup = bloodGroup;
        c.visionLeft = visionLeft;
        c.visionRight = visionRight;
        c.allergies = allergies;
        c.conditions = conditions;
        c.medications = medications;
        c.emergencyContactName = emergencyContactName;
        c.emergencyContactPhone = emergencyContactPhone;
        c.familyDoctor = familyDoctor;
        c.lastCheckupDate = lastCheckupDate;
        c.updatedBy = by;
        c.updatedAt = at;
        return c;
    }

    public static HealthProfile empty(String studentId) {
        HealthProfile c = new HealthProfile();
        c.id = studentId;
        return c;
    }

    @Override
    public String id() {
        return id;
    }

    public Double heightCm() {
        return heightCm;
    }

    public Double weightKg() {
        return weightKg;
    }

    public String allergies() {
        return allergies;
    }

    public String conditions() {
        return conditions;
    }
}
