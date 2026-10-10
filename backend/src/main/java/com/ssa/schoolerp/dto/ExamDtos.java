package com.ssa.schoolerp.dto;

import com.ssa.schoolerp.model.ExamSchedule;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;
import java.util.List;

public final class ExamDtos {

    private ExamDtos() {
    }

    /**
     * Saves marks for one exam paper. Entries with neither marks nor "absent" are skipped rather than
     * stored as zero. {@code submit} marks the entries final; otherwise they are saved as a draft.
     */
    public record MarksSaveRequest(@NotEmpty List<@Valid MarksEntry> entries, boolean submit) {
    }

    /** {@code clear: true} deletes the student's saved marks for this paper (back to "Not Entered"). */
    public record MarksEntry(@NotBlank String studentId, @PositiveOrZero Double obtainedMarks, boolean absent,
                             boolean clear) {
    }

    /** How far marks entry has got for one paper. */
    public record MarksProgress(
            String scheduleId,
            String examId,
            String subject,
            String className,
            LocalDate date,
            int entered,
            int submitted,
            int totalStudents) {
    }

    /** The marks-entry grid for a paper: every student of the class, whether or not marks exist yet. */
    public record MarksSheet(ExamSchedule schedule, String examName, List<MarksSheetRow> rows) {
    }

    public record MarksSheetRow(
            String studentId,
            String studentName,
            int rollNumber,
            Double obtainedMarks,
            boolean absent,
            String status) {
    }

    public record SubjectResult(
            String examId,
            String examName,
            String subject,
            LocalDate date,
            int maxMarks,
            int passingMarks,
            Double obtainedMarks,
            boolean absent,
            Double percentage,
            String grade,
            boolean passed) {
    }

    public record StudentResult(
            String studentId,
            String studentName,
            String className,
            List<SubjectResult> subjects,
            int totalMaxMarks,
            double totalObtained,
            Double percentage,
            String grade) {
    }

    public record UpcomingPaper(
            String scheduleId,
            String examId,
            String examName,
            String subject,
            String className,
            LocalDate date,
            String startTime,
            String endTime,
            int maxMarks) {
    }

    public record PendingMarksEntry(
            String scheduleId,
            String examName,
            String subject,
            String className,
            LocalDate date,
            int entered,
            int totalStudents) {
    }

    public record ClassResultRow(
            int rank,
            String studentId,
            String studentName,
            int rollNumber,
            int totalMaxMarks,
            double totalObtained,
            double percentage,
            String grade,
            boolean passedAll) {
    }
}
