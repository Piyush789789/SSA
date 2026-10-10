package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** A parent-teacher meeting slot offered by a teacher; a parent books it for one of their children. */
@Entity
@Table(indexes = {
        @Index(name = "idx_ptm_teacher", columnList = "teacherId"),
        @Index(name = "idx_ptm_date", columnList = "date")})
@JsonFields
public class PtmSlot implements Identifiable {

    @Id
    private String id;

    private String title;
    private String teacherId;
    private String teacherName;
    private LocalDate date;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    /** "Room 12" or a video-call link. */
    private String location;

    private String parentId;
    private String parentName;
    private String studentId;
    private String studentName;
    private String className;
    private String parentNote;
    private LocalDateTime bookedAt;

    protected PtmSlot() {
    }

    public PtmSlot(String id, String title, String teacherId, String teacherName, LocalDate date, LocalTime startTime,
                   LocalTime endTime, String location) {
        this.id = id;
        this.title = title;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
    }

    public PtmSlot booked(String newParentId, String newParentName, Student student, String note, LocalDateTime at) {
        PtmSlot c = new PtmSlot(id, title, teacherId, teacherName, date, startTime, endTime, location);
        if (student != null) {
            c.parentId = newParentId;
            c.parentName = newParentName;
            c.studentId = student.id();
            c.studentName = student.name();
            c.className = student.className();
            c.parentNote = note;
            c.bookedAt = at;
        }
        return c;
    }

    public boolean isBooked() {
        return studentId != null;
    }

    @Override
    public String id() {
        return id;
    }

    public String title() {
        return title;
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

    public LocalTime startTime() {
        return startTime;
    }

    public LocalTime endTime() {
        return endTime;
    }

    public String parentId() {
        return parentId;
    }

    public String studentId() {
        return studentId;
    }

    public String studentName() {
        return studentName;
    }
}
