package com.ssa.schoolerp.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

/** One paper of an exam: a subject for a class on a date. */
public record ExamSchedule(
        String id,
        String examId,
        @NotBlank String subject,
        @NotBlank String className,
        @NotNull LocalDate date,
        String startTime,
        String endTime,
        @Positive int maxMarks,
        @PositiveOrZero int passingMarks,
        String status) implements Identifiable {

    public ExamSchedule withIds(String newId, String newExamId) {
        return new ExamSchedule(newId, newExamId, subject, className, date, startTime, endTime, maxMarks,
                passingMarks, status);
    }

    public ExamSchedule withStatus(String newStatus) {
        return new ExamSchedule(id, examId, subject, className, date, startTime, endTime, maxMarks,
                passingMarks, newStatus);
    }
}
