package com.ssa.schoolerp.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The class teacher's part of a report card for one term: co-scholastic grades (area → A/B/C) and a remark.
 * Id = studentId|academicYear|term.
 */
@Entity
@JsonFields
public class ReportCardNote implements Identifiable {

    @Id
    private String id;

    private String studentId;
    private String academicYear;
    private String term;

    @Column(length = 1000)
    private String remark;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_card_grade", joinColumns = @JoinColumn(name = "note_id"))
    @MapKeyColumn(name = "area")
    @Column(name = "grade")
    private Map<String, String> coScholastic = new LinkedHashMap<>();

    private String updatedBy;
    private LocalDateTime updatedAt;

    protected ReportCardNote() {
    }

    public ReportCardNote(String studentId, String academicYear, String term, String remark,
                          Map<String, String> coScholastic, String updatedBy, LocalDateTime updatedAt) {
        this.id = idFor(studentId, academicYear, term);
        this.studentId = studentId;
        this.academicYear = academicYear;
        this.term = term;
        this.remark = remark;
        this.coScholastic = new LinkedHashMap<>(coScholastic == null ? Map.of() : coScholastic);
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }

    public static String idFor(String studentId, String academicYear, String term) {
        return studentId + "|" + academicYear + "|" + term;
    }

    @Override
    public String id() {
        return id;
    }

    public String term() {
        return term;
    }
}
