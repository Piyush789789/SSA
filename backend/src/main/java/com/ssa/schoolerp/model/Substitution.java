package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.DayOfWeek;
import java.time.LocalDate;

/** A teacher covering another teacher's period on one date. Id = date|className|periodId. */
@Entity
@Table(indexes = @Index(name = "idx_substitution_date", columnList = "date"))
@JsonFields
public class Substitution implements Identifiable {

    @Id
    private String id;

    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private DayOfWeek day;

    private String className;
    private String periodId;
    private String subject;
    private String room;
    private String originalTeacherId;
    private String originalTeacherName;
    private String substituteTeacherId;
    private String substituteTeacherName;
    private String assignedBy;

    protected Substitution() {
    }

    public Substitution(LocalDate date, String className, String periodId, String subject, String room,
                        String originalTeacherId, String originalTeacherName, String substituteTeacherId,
                        String substituteTeacherName, String assignedBy) {
        this.id = idFor(date, className, periodId);
        this.date = date;
        this.day = date.getDayOfWeek();
        this.className = className;
        this.periodId = periodId;
        this.subject = subject;
        this.room = room;
        this.originalTeacherId = originalTeacherId;
        this.originalTeacherName = originalTeacherName;
        this.substituteTeacherId = substituteTeacherId;
        this.substituteTeacherName = substituteTeacherName;
        this.assignedBy = assignedBy;
    }

    public static String idFor(LocalDate date, String className, String periodId) {
        return date + "|" + className + "|" + periodId;
    }

    @Override
    public String id() {
        return id;
    }

    public LocalDate date() {
        return date;
    }

    public String periodId() {
        return periodId;
    }

    public String className() {
        return className;
    }

    public String substituteTeacherId() {
        return substituteTeacherId;
    }
}
