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

    private ReferenceData() {
    }
}
