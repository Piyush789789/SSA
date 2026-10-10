package com.ssa.schoolerp.model;

/** A student's marks for one exam paper. {@code obtainedMarks} is null when the student was absent. */
public record MarksRecord(
        String id,
        String examId,
        String scheduleId,
        String className,
        String subject,
        String studentId,
        String studentName,
        int rollNumber,
        int maxMarks,
        Double obtainedMarks,
        boolean absent,
        String status,
        String enteredBy) implements Identifiable {

    public static final String DRAFT = "Draft";
    public static final String SUBMITTED = "Submitted";

    /** One record per student per paper, so saving again overwrites instead of duplicating. */
    public static String idFor(String scheduleId, String studentId) {
        return "MRK-" + scheduleId + "-" + studentId;
    }
}
