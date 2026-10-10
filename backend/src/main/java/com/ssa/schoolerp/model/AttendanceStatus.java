package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum AttendanceStatus {
    PRESENT, ABSENT, LATE, LEAVE, HOLIDAY;

    @JsonValue
    public String toJson() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static AttendanceStatus fromJson(String value) {
        return valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
