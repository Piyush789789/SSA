package com.ssa.schoolerp.service;

import java.util.List;

/** The school's grade scale. Same bands as DEFAULT_GRADE_CONFIG in the frontend. */
public final class Grading {

    public record GradeBand(int min, int max, String grade, double gpa, String label) {
    }

    public static final List<GradeBand> BANDS = List.of(
            new GradeBand(90, 100, "A+", 10.0, "Outstanding"),
            new GradeBand(80, 89, "A", 9.0, "Excellent"),
            new GradeBand(70, 79, "B+", 8.0, "Very Good"),
            new GradeBand(60, 69, "B", 7.0, "Good"),
            new GradeBand(50, 59, "C", 6.0, "Average"),
            new GradeBand(40, 49, "D", 5.0, "Pass"),
            new GradeBand(0, 39, "F", 0.0, "Fail"));

    private Grading() {
    }

    public static GradeBand bandFor(double percentage) {
        int rounded = (int) Math.round(Math.max(0, Math.min(100, percentage)));
        return BANDS.stream()
                .filter(band -> rounded >= band.min() && rounded <= band.max())
                .findFirst()
                .orElseThrow();
    }

    public static double percentage(double obtained, int max) {
        return max == 0 ? 0 : round1(obtained * 100.0 / max);
    }

    public static double round1(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
