package com.ssa.schoolerp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

/** A school calendar entry. HOLIDAY closes the school (no attendance); EVENT is informational. */
@Entity
@Table(indexes = @Index(name = "idx_calendar_start", columnList = "startDate"))
@JsonFields
public class CalendarEvent implements Identifiable {

    public static final String HOLIDAY = "HOLIDAY";
    public static final String EVENT = "EVENT";

    @Id
    private String id;

    @NotBlank
    private String title;

    @NotNull
    private LocalDate startDate;

    /** Inclusive; null = one day. */
    private LocalDate endDate;

    @Pattern(regexp = "HOLIDAY|EVENT")
    private String type;

    @Column(length = 1000)
    private String description;

    protected CalendarEvent() {
    }

    public CalendarEvent(String id, String title, LocalDate startDate, LocalDate endDate, String type, String description) {
        this.id = id;
        this.title = title;
        this.startDate = startDate;
        this.endDate = endDate;
        this.type = type;
        this.description = description;
    }

    public boolean covers(LocalDate date) {
        return !date.isBefore(startDate) && !date.isAfter(lastDate());
    }

    public LocalDate lastDate() {
        return endDate == null ? startDate : endDate;
    }

    public boolean isHoliday() {
        return HOLIDAY.equals(type);
    }

    @Override
    public String id() {
        return id;
    }

    public String title() {
        return title;
    }

    public LocalDate startDate() {
        return startDate;
    }

    public LocalDate endDate() {
        return endDate;
    }

    public String type() {
        return type;
    }

    public String description() {
        return description;
    }
}
