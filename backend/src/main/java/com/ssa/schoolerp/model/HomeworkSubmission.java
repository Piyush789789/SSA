package com.ssa.schoolerp.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** A student's answer to a homework: text and/or photos ({@link StoredFile} ids). Id = homeworkId|studentId. */
@Entity
@Table(indexes = @Index(name = "idx_submission_homework", columnList = "homeworkId"))
@JsonFields
public class HomeworkSubmission implements Identifiable {

    public static final String SUBMITTED = "SUBMITTED";
    public static final String REVIEWED = "REVIEWED";
    public static final String REDO = "REDO";

    @Id
    private String id;

    private String homeworkId;
    private String studentId;
    private String studentName;
    private String className;

    @Column(length = 4000)
    private String text;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "homework_submission_file", joinColumns = @JoinColumn(name = "submission_id"))
    @Column(name = "file_id")
    @OrderColumn(name = "position")
    private List<String> fileIds = new ArrayList<>();

    private LocalDateTime submittedAt;
    private boolean late;
    private String status;
    private String grade;

    @Column(length = 2000)
    private String feedback;

    private String reviewedBy;
    private LocalDateTime reviewedAt;

    protected HomeworkSubmission() {
    }

    public HomeworkSubmission(String homeworkId, String studentId, String studentName, String className, String text,
                              List<String> fileIds, LocalDateTime submittedAt, boolean late, String status, String grade,
                              String feedback, String reviewedBy, LocalDateTime reviewedAt) {
        this.id = idFor(homeworkId, studentId);
        this.homeworkId = homeworkId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.className = className;
        this.text = text;
        this.fileIds = new ArrayList<>(fileIds);
        this.submittedAt = submittedAt;
        this.late = late;
        this.status = status;
        this.grade = grade;
        this.feedback = feedback;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
    }

    public static String idFor(String homeworkId, String studentId) {
        return homeworkId + "|" + studentId;
    }

    public HomeworkSubmission reviewed(String newStatus, String newGrade, String newFeedback, String reviewer,
                                       LocalDateTime at) {
        return new HomeworkSubmission(homeworkId, studentId, studentName, className, text, fileIds, submittedAt, late,
                newStatus, newGrade, newFeedback, reviewer, at);
    }

    @Override
    public String id() {
        return id;
    }

    public String homeworkId() {
        return homeworkId;
    }

    public String studentId() {
        return studentId;
    }

    public String status() {
        return status;
    }

    public List<String> fileIds() {
        return fileIds;
    }
}
