package com.ssa.schoolerp.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonFields
public class Teacher implements Identifiable {

    @Id
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    private String phone;
    private String qualification;
    private String experience;
    private LocalDate joiningDate;

    @NotEmpty
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "teacher_subject", joinColumns = @JoinColumn(name = "teacher_id"))
    @Column(name = "subject")
    @OrderColumn(name = "position")
    private List<String> subjects = new ArrayList<>();

    @NotNull
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "teacher_class", joinColumns = @JoinColumn(name = "teacher_id"))
    @Column(name = "class_name")
    @OrderColumn(name = "position")
    private List<String> assignedClasses = new ArrayList<>();

    protected Teacher() {
    }

    public Teacher(String id, String name, String email, String phone, String qualification, String experience,
                   LocalDate joiningDate, List<String> subjects, List<String> assignedClasses) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.qualification = qualification;
        this.experience = experience;
        this.joiningDate = joiningDate;
        this.subjects = new ArrayList<>(subjects);
        this.assignedClasses = new ArrayList<>(assignedClasses);
    }

    public Teacher withId(String newId) {
        return new Teacher(newId, name, email, phone, qualification, experience, joiningDate, subjects,
                assignedClasses);
    }

    public boolean teaches(String className, String subject) {
        return assignedClasses.contains(className) && subjects.contains(subject);
    }

    @Override
    public String id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String email() {
        return email;
    }

    public String phone() {
        return phone;
    }

    public String qualification() {
        return qualification;
    }

    public String experience() {
        return experience;
    }

    public LocalDate joiningDate() {
        return joiningDate;
    }

    public List<String> subjects() {
        return subjects;
    }

    public List<String> assignedClasses() {
        return assignedClasses;
    }
}
