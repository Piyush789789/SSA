package com.ssa.schoolerp.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** A fee charged to every student of the listed classes. Amounts are whole rupees. */
@Entity
@JsonFields
public class FeeHead implements Identifiable {

    @Id
    private String id;

    @NotBlank
    private String title;

    @Positive
    private long amount;

    @NotBlank
    private String frequency;

    @NotNull
    private LocalDate dueDate;

    private String academicYear;

    @NotEmpty
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "fee_head_class", joinColumns = @JoinColumn(name = "fee_head_id"))
    @Column(name = "class_name")
    @OrderColumn(name = "position")
    private List<String> classNames = new ArrayList<>();

    protected FeeHead() {
    }

    public FeeHead(String id, String title, long amount, String frequency, LocalDate dueDate, String academicYear,
                   List<String> classNames) {
        this.id = id;
        this.title = title;
        this.amount = amount;
        this.frequency = frequency;
        this.dueDate = dueDate;
        this.academicYear = academicYear;
        this.classNames = new ArrayList<>(classNames);
    }

    @Override
    public String id() {
        return id;
    }

    public String title() {
        return title;
    }

    public long amount() {
        return amount;
    }

    public String frequency() {
        return frequency;
    }

    public LocalDate dueDate() {
        return dueDate;
    }

    public String academicYear() {
        return academicYear;
    }

    public List<String> classNames() {
        return classNames;
    }
}
