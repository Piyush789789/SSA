package com.ssa.schoolerp.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;

import java.util.ArrayList;
import java.util.List;

@Entity
@JsonFields
public class Parent implements Identifiable {

    @Id
    private String id;

    private String name;
    private String email;
    private String phone;
    private String relation;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "parent_child", joinColumns = @JoinColumn(name = "parent_id"))
    @Column(name = "student_id")
    @OrderColumn(name = "position")
    private List<String> childIds = new ArrayList<>();

    protected Parent() {
    }

    public Parent(String id, String name, String email, String phone, String relation, List<String> childIds) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.relation = relation;
        this.childIds = new ArrayList<>(childIds);
    }

    public Parent withChildIds(List<String> newChildIds) {
        return new Parent(id, name, email, phone, relation, newChildIds);
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

    public String relation() {
        return relation;
    }

    public List<String> childIds() {
        return childIds;
    }
}
