package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;

/** A student's bus route and stop. Id = studentId (one route per student). */
@Entity
@Table(indexes = @Index(name = "idx_transport_route", columnList = "routeId"))
@JsonFields
public class TransportAssignment implements Identifiable {

    @Id
    private String id;

    private String routeId;
    private String stopName;
    private String studentName;
    private String className;
    private LocalDate since;

    protected TransportAssignment() {
    }

    public TransportAssignment(String studentId, String routeId, String stopName, String studentName, String className,
                               LocalDate since) {
        this.id = studentId;
        this.routeId = routeId;
        this.stopName = stopName;
        this.studentName = studentName;
        this.className = className;
        this.since = since;
    }

    @Override
    public String id() {
        return id;
    }

    public String studentId() {
        return id;
    }

    public String routeId() {
        return routeId;
    }

    public String stopName() {
        return stopName;
    }
}
