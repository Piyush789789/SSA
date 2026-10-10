package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(indexes = {
        @Index(name = "idx_attendance_student", columnList = "studentId"),
        @Index(name = "idx_attendance_class_date", columnList = "className, date"),
        @Index(name = "idx_attendance_date", columnList = "date")})
@JsonFields
public class AttendanceRecord implements Identifiable {

    @Id
    private String id;

    private String studentId;
    private String className;
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private AttendanceStatus status;

    private String checkInTime;
    private String remarks;
    private String markedBy;

    protected AttendanceRecord() {
    }

    public AttendanceRecord(String id, String studentId, String className, LocalDate date, AttendanceStatus status,
                            String checkInTime, String remarks, String markedBy) {
        this.id = id;
        this.studentId = studentId;
        this.className = className;
        this.date = date;
        this.status = status;
        this.checkInTime = checkInTime;
        this.remarks = remarks;
        this.markedBy = markedBy;
    }

    /** One record per student per day, so re-marking a day overwrites instead of duplicating. */
    public static String idFor(String studentId, LocalDate date) {
        return "ATT-" + date + "-" + studentId;
    }

    @Override
    public String id() {
        return id;
    }

    public String studentId() {
        return studentId;
    }

    public String className() {
        return className;
    }

    public LocalDate date() {
        return date;
    }

    public AttendanceStatus status() {
        return status;
    }

    public String checkInTime() {
        return checkInTime;
    }

    public String remarks() {
        return remarks;
    }

    public String markedBy() {
        return markedBy;
    }
}
