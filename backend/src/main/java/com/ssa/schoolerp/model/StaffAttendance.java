package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;

/** A teacher's attendance for one day. Id = teacherId|date. Status: PRESENT, ABSENT, LEAVE, HALF_DAY. */
@Entity
@Table(indexes = @Index(name = "idx_staff_attendance_date", columnList = "date"))
@JsonFields
public class StaffAttendance implements Identifiable {

    public static final String PRESENT = "PRESENT";
    public static final String ABSENT = "ABSENT";
    public static final String LEAVE = "LEAVE";
    public static final String HALF_DAY = "HALF_DAY";

    @Id
    private String id;

    private String teacherId;
    private String teacherName;
    private LocalDate date;
    private String status;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime checkIn;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime checkOut;

    private String markedBy;

    protected StaffAttendance() {
    }

    public StaffAttendance(String teacherId, String teacherName, LocalDate date, String status, LocalTime checkIn,
                           LocalTime checkOut, String markedBy) {
        this.id = idFor(teacherId, date);
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.date = date;
        this.status = status;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.markedBy = markedBy;
    }

    public static String idFor(String teacherId, LocalDate date) {
        return teacherId + "|" + date;
    }

    @Override
    public String id() {
        return id;
    }

    public String teacherId() {
        return teacherId;
    }

    public String teacherName() {
        return teacherName;
    }

    public LocalDate date() {
        return date;
    }

    public String status() {
        return status;
    }

    public LocalTime checkIn() {
        return checkIn;
    }

    public LocalTime checkOut() {
        return checkOut;
    }

    public boolean away() {
        return ABSENT.equals(status) || LEAVE.equals(status);
    }
}
