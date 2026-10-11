package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

/** One paper of an exam: a subject for a class on a date. */
@Entity
@JsonFields
public class ExamSchedule implements Identifiable {

    @Id
    private String id;

    private String examId;

    @NotBlank
    private String subject;

    @NotBlank
    private String className;

    @NotNull
    private LocalDate date;

    private String startTime;
    private String endTime;

    @Positive
    private int maxMarks;

    @PositiveOrZero
    private int passingMarks;

    private String status;

    /** Question-wise breakdown (optional). When set, the questions' marks add up to {@code maxMarks}. */
    @jakarta.persistence.ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
    @jakarta.persistence.CollectionTable(name = "exam_question",
            joinColumns = @jakarta.persistence.JoinColumn(name = "schedule_id"))
    @jakarta.persistence.OrderColumn(name = "position")
    private java.util.List<@jakarta.validation.Valid Question> questions;

    protected ExamSchedule() {
    }

    public ExamSchedule(String id, String examId, String subject, String className, LocalDate date, String startTime,
                        String endTime, int maxMarks, int passingMarks, String status) {
        this.id = id;
        this.examId = examId;
        this.subject = subject;
        this.className = className;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.maxMarks = maxMarks;
        this.passingMarks = passingMarks;
        this.status = status;
    }

    public ExamSchedule withIds(String newId, String newExamId) {
        return new ExamSchedule(newId, newExamId, subject, className, date, startTime, endTime, maxMarks,
                passingMarks, status).withQuestions(questions);
    }

    public ExamSchedule withStatus(String newStatus) {
        return new ExamSchedule(id, examId, subject, className, date, startTime, endTime, maxMarks,
                passingMarks, newStatus).withQuestions(questions);
    }

    public ExamSchedule withQuestions(java.util.List<Question> newQuestions) {
        ExamSchedule copy = new ExamSchedule(id, examId, subject, className, date, startTime, endTime, maxMarks,
                passingMarks, status);
        copy.questions = newQuestions == null ? new java.util.ArrayList<>() : new java.util.ArrayList<>(newQuestions);
        return copy;
    }

    /** True when the request body carried no "questions" field at all (an older form): keep the saved ones. */
    public boolean questionsMissing() {
        return questions == null;
    }

    public java.util.List<Question> questions() {
        return questions == null ? java.util.List.of() : questions;
    }

    @Override
    public String id() {
        return id;
    }

    public String examId() {
        return examId;
    }

    public String subject() {
        return subject;
    }

    public String className() {
        return className;
    }

    public LocalDate date() {
        return date;
    }

    public String startTime() {
        return startTime;
    }

    public String endTime() {
        return endTime;
    }

    public int maxMarks() {
        return maxMarks;
    }

    public int passingMarks() {
        return passingMarks;
    }

    public String status() {
        return status;
    }
}
