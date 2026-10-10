package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

@Entity
@JsonFields
public class StudyMaterial implements Identifiable {

    @Id
    private String id;

    @NotBlank
    private String title;

    @NotBlank
    private String subject;

    @NotBlank
    private String className;

    @NotBlank
    private String category;

    private LocalDate uploadedDate;
    private String fileType;
    private String fileSize;
    private String teacherId;
    private String teacherName;

    protected StudyMaterial() {
    }

    public StudyMaterial(String id, String title, String subject, String className, String category,
                         LocalDate uploadedDate, String fileType, String fileSize, String teacherId,
                         String teacherName) {
        this.id = id;
        this.title = title;
        this.subject = subject;
        this.className = className;
        this.category = category;
        this.uploadedDate = uploadedDate;
        this.fileType = fileType;
        this.fileSize = fileSize;
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

    public String subject() {
        return subject;
    }

    public String className() {
        return className;
    }

    public String category() {
        return category;
    }

    public LocalDate uploadedDate() {
        return uploadedDate;
    }

    public String fileType() {
        return fileType;
    }

    public String fileSize() {
        return fileSize;
    }

    public String teacherId() {
        return teacherId;
    }

    public String teacherName() {
        return teacherName;
    }
}
