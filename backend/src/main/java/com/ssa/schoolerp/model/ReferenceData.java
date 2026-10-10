package com.ssa.schoolerp.model;

import java.util.List;

/** Fixed option lists shared by validation and the {@code /api/meta} endpoint. */
public final class ReferenceData {

    public static final String ACADEMIC_YEAR = "2026-27";

    public static final List<String> SUBJECTS = List.of(
            "English", "Hindi", "Mathematics", "Science", "Environmental Studies", "Social Science",
            "Computer Science", "Art & Craft", "Physical Education", "General Knowledge");

    public static final List<String> EXAM_TYPES = List.of(
            "Unit Test", "Periodic Test", "Mid-Term", "Half-Yearly", "Final", "Pre-Board", "Custom");

    public static final List<String> MATERIAL_CATEGORIES = List.of(
            "Notes", "Worksheet", "Assignment", "Reference", "Revision");

    public static final List<String> PAYMENT_MODES = List.of(
            "Cash", "UPI", "Card", "Cheque", "DD", "Bank Transfer");

    /** Ways a family can pay outside the school office and then report the payment from the app. */
    public static final List<String> DEPOSIT_MODES = List.of("UPI", "Bank Transfer", "Cheque", "DD");

    public static final List<String> FEE_FREQUENCIES = List.of(
            "One-Time", "Monthly", "Quarterly", "Half-Yearly", "Annual");

    public static final List<String> CONCESSION_TYPES = List.of(
            "Merit", "Sibling", "Staff Ward", "Financial Aid", "Sports");

    /** CBSE co-scholastic areas graded A/B/C on the report card. */
    public static final List<String> CO_SCHOLASTIC_AREAS = List.of(
            "Work Education", "Art Education", "Health & Physical Education", "Discipline");

    public static final List<String> CO_SCHOLASTIC_GRADES = List.of("A", "B", "C");

    public static final List<String> REPORT_TERMS = List.of("Term 1", "Term 2");

    public static final List<String> CONDUCT_OPTIONS = List.of("Excellent", "Very Good", "Good", "Satisfactory");

    private ReferenceData() {
    }
}
