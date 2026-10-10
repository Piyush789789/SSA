package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** A visit to the school sick room: what happened and what was done. Parents are notified. */
@Entity
@Table(indexes = @Index(name = "idx_health_visit_student", columnList = "studentId"))
@JsonFields
public class HealthVisit implements Identifiable {

    @Id
    private String id;

    private String studentId;
    private String studentName;
    private LocalDateTime at;

    @Column(length = 1000)
    private String complaint;

    @Column(length = 1000)
    private String actionTaken;

    private boolean sentHome;
    private String recordedBy;

    protected HealthVisit() {
    }

    public HealthVisit(String id, String studentId, String studentName, LocalDateTime at, String complaint,
                       String actionTaken, boolean sentHome, String recordedBy) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.at = at;
        this.complaint = complaint;
        this.actionTaken = actionTaken;
        this.sentHome = sentHome;
        this.recordedBy = recordedBy;
    }

    @Override
    public String id() {
        return id;
    }

    public String complaint() {
        return complaint;
    }

    public String actionTaken() {
        return actionTaken;
    }

    public boolean sentHome() {
        return sentHome;
    }
}
