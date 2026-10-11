package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/** A student's marks for one exam paper. {@code obtainedMarks} is null when the student was absent. */
@Entity
@Table(indexes = {
        @Index(name = "idx_marks_schedule", columnList = "scheduleId"),
        @Index(name = "idx_marks_student", columnList = "studentId")})
@JsonFields
public class MarksRecord implements Identifiable {

    public static final String DRAFT = "Draft";
    public static final String SUBMITTED = "Submitted";

    @Id
    private String id;

    private String examId;
    private String scheduleId;
    private String className;
    private String subject;
    private String studentId;
    private String studentName;
    private int rollNumber;
    private int maxMarks;
    private Double obtainedMarks;
    private boolean absent;
    private String status;
    private String enteredBy;

    /**
     * Marks per question, in the paper's question order, as "3,5,,6" (an empty item = not attempted). Null when
     * only a total was entered. Stored as text so blanks keep their position.
     */
    @com.fasterxml.jackson.annotation.JsonIgnore
    @jakarta.persistence.Column(name = "question_marks", length = 1000)
    private String questionMarksText;

    protected MarksRecord() {
    }

    public MarksRecord(String id, String examId, String scheduleId, String className, String subject, String studentId,
                       String studentName, int rollNumber, int maxMarks, Double obtainedMarks, boolean absent,
                       String status, String enteredBy) {
        this.id = id;
        this.examId = examId;
        this.scheduleId = scheduleId;
        this.className = className;
        this.subject = subject;
        this.studentId = studentId;
        this.studentName = studentName;
        this.rollNumber = rollNumber;
        this.maxMarks = maxMarks;
        this.obtainedMarks = obtainedMarks;
        this.absent = absent;
        this.status = status;
        this.enteredBy = enteredBy;
    }

    public MarksRecord withQuestionMarks(java.util.List<Double> marks) {
        MarksRecord copy = copyWith(maxMarks);
        copy.questionMarksText = marks == null ? null : marks.stream()
                .map(v -> v == null ? "" : (v == Math.floor(v) ? String.valueOf(v.longValue()) : String.valueOf(v)))
                .collect(java.util.stream.Collectors.joining(","));
        return copy;
    }

    /** Same record with the paper's new maximum (the question marks are kept). */
    public MarksRecord copyWith(int newMaxMarks) {
        MarksRecord copy = new MarksRecord(id, examId, scheduleId, className, subject, studentId, studentName,
                rollNumber, newMaxMarks, obtainedMarks, absent, status, enteredBy);
        copy.questionMarksText = questionMarksText;
        return copy;
    }

    /** Marks per question (null items = not attempted), or null when only a total was entered. */
    @com.fasterxml.jackson.annotation.JsonProperty("questionMarks")
    public java.util.List<Double> questionMarks() {
        if (questionMarksText == null) return null;
        java.util.List<Double> list = new java.util.ArrayList<>();
        for (String part : questionMarksText.split(",", -1)) {
            list.add(part.isBlank() ? null : Double.valueOf(part));
        }
        return list;
    }

    /** One record per student per paper, so saving again overwrites instead of duplicating. */
    public static String idFor(String scheduleId, String studentId) {
        return "MRK-" + scheduleId + "-" + studentId;
    }

    @Override
    public String id() {
        return id;
    }

    public String examId() {
        return examId;
    }

    public String scheduleId() {
        return scheduleId;
    }

    public String className() {
        return className;
    }

    public String subject() {
        return subject;
    }

    public String studentId() {
        return studentId;
    }

    public String studentName() {
        return studentName;
    }

    public int rollNumber() {
        return rollNumber;
    }

    public int maxMarks() {
        return maxMarks;
    }

    public Double obtainedMarks() {
        return obtainedMarks;
    }

    public boolean absent() {
        return absent;
    }

    public String status() {
        return status;
    }

    public String enteredBy() {
        return enteredBy;
    }
}
