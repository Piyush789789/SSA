package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/** Where a student sits for an exam. Id = examId|studentId. */
@Entity
@Table(indexes = @Index(name = "idx_exam_seat_exam", columnList = "examId"))
@JsonFields
public class ExamSeat implements Identifiable {

    @Id
    private String id;

    private String examId;
    private String studentId;
    private String studentName;
    private String className;
    private Integer rollNumber;
    private String room;
    private int seatNumber;

    protected ExamSeat() {
    }

    public ExamSeat(String examId, String studentId, String studentName, String className, Integer rollNumber,
                    String room, int seatNumber) {
        this.id = examId + "|" + studentId;
        this.examId = examId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.className = className;
        this.rollNumber = rollNumber;
        this.room = room;
        this.seatNumber = seatNumber;
    }

    @Override
    public String id() {
        return id;
    }

    public String studentId() {
        return studentId;
    }

    public String studentName() {
        return studentName;
    }

    public Integer rollNumber() {
        return rollNumber;
    }

    public String className() {
        return className;
    }

    public String room() {
        return room;
    }

    public int seatNumber() {
        return seatNumber;
    }
}
