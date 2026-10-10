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
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonFields
public class Homework implements Identifiable {

    @Id
    private String id;

    @NotBlank
    private String title;

    @Column(length = 4000)
    private String description;

    @NotBlank
    private String subject;

    @NotBlank
    private String className;

    private LocalDate assignedDate;

    @NotNull
    private LocalDate dueDate;

    @Column(length = 4000)
    private String instructions;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "homework_attachment", joinColumns = @JoinColumn(name = "homework_id"))
    @Column(name = "file_name")
    @OrderColumn(name = "position")
    private List<String> attachments = new ArrayList<>();

    private String teacherId;
    private String teacherName;

    protected Homework() {
    }

    public Homework(String id, String title, String description, String subject, String className,
                    LocalDate assignedDate, LocalDate dueDate, String instructions, List<String> attachments,
                    String teacherId, String teacherName) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.className = className;
        this.assignedDate = assignedDate;
        this.dueDate = dueDate;
        this.instructions = instructions;
        this.attachments = attachments == null ? new ArrayList<>() : new ArrayList<>(attachments);
        this.teacherId = teacherId;
        this.teacherName = teacherName;
    }

    @Override
    public String id() {
        return id;
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }

    public String subject() {
        return subject;
    }

    public String className() {
        return className;
    }

    public LocalDate assignedDate() {
        return assignedDate;
    }

    public LocalDate dueDate() {
        return dueDate;
    }

    public String instructions() {
        return instructions;
    }

    public List<String> attachments() {
        return attachments;
    }

    public String teacherId() {
        return teacherId;
    }

    public String teacherName() {
        return teacherName;
    }
}
