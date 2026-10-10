package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

import java.time.DayOfWeek;

@Entity
@JsonFields
public class TimetableEntry implements Identifiable {

    @Id
    private String id;

    private String className;

    @Enumerated(EnumType.STRING)
    private DayOfWeek day;

    private String periodId;
    private String subject;
    private String teacherId;
    private String teacherName;
    private String room;

    protected TimetableEntry() {
    }

    public TimetableEntry(String id, String className, DayOfWeek day, String periodId, String subject,
                          String teacherId, String teacherName, String room) {
        this.id = id;
        this.className = className;
        this.day = day;
        this.periodId = periodId;
        this.subject = subject;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.room = room;
    }

    /** One entry per class slot, so editing a slot overwrites it. */
    public static String idFor(String className, DayOfWeek day, String periodId) {
        return "TT-" + className + "-" + day + "-" + periodId;
    }

    @Override
    public String id() {
        return id;
    }

    public String className() {
        return className;
    }

    public DayOfWeek day() {
        return day;
    }

    public String periodId() {
        return periodId;
    }

    public String subject() {
        return subject;
    }

    public String teacherId() {
        return teacherId;
    }

    public String teacherName() {
        return teacherName;
    }

    public String room() {
        return room;
    }
}
