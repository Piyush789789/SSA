package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalTime;

@Entity
@JsonFields
public class TimetablePeriod implements Identifiable {

    @Id
    @NotBlank
    private String id;

    @NotBlank
    private String label;

    @NotNull
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @NotNull
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    @Pattern(regexp = "period|break")
    private String type;

    protected TimetablePeriod() {
    }

    public TimetablePeriod(String id, String label, LocalTime startTime, LocalTime endTime, String type) {
        this.id = id;
        this.label = label;
        this.startTime = startTime;
        this.endTime = endTime;
        this.type = type;
    }

    @Override
    public String id() {
        return id;
    }

    public String label() {
        return label;
    }

    public LocalTime startTime() {
        return startTime;
    }

    public LocalTime endTime() {
        return endTime;
    }

    public String type() {
        return type;
    }
}
