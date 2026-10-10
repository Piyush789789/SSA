package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/** A bus/van route with its stops in order. */
@Entity
@JsonFields
public class TransportRoute implements Identifiable {

    /** A stop with its morning pick-up and afternoon drop times. */
    @Embeddable
    public record Stop(
            @NotBlank @Size(max = 80) String name,
            @JsonFormat(pattern = "HH:mm") LocalTime pickupTime,
            @JsonFormat(pattern = "HH:mm") LocalTime dropTime) {
    }

    @Id
    private String id;

    @NotBlank
    @Size(max = 60)
    private String name;

    @Size(max = 20)
    private String vehicleNumber;

    @Size(max = 60)
    private String driverName;

    @Size(max = 20)
    private String driverPhone;

    @Size(max = 60)
    private String attendantName;

    @Size(max = 20)
    private String attendantPhone;

    @Min(1)
    private int capacity;

    /** Monthly transport fee in rupees. */
    @Min(0)
    private long monthlyFee;

    @Valid
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "transport_stop", joinColumns = @JoinColumn(name = "route_id"))
    @OrderColumn(name = "position")
    private List<Stop> stops = new ArrayList<>();

    protected TransportRoute() {
    }

    public TransportRoute withId(String newId) {
        TransportRoute c = new TransportRoute();
        c.id = newId;
        c.name = name.trim();
        c.vehicleNumber = vehicleNumber;
        c.driverName = driverName;
        c.driverPhone = driverPhone;
        c.attendantName = attendantName;
        c.attendantPhone = attendantPhone;
        c.capacity = capacity;
        c.monthlyFee = monthlyFee;
        c.stops = new ArrayList<>(stops == null ? List.of() : stops);
        return c;
    }

    @Override
    public String id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String vehicleNumber() {
        return vehicleNumber;
    }

    public String driverName() {
        return driverName;
    }

    public String driverPhone() {
        return driverPhone;
    }

    public int capacity() {
        return capacity;
    }

    public long monthlyFee() {
        return monthlyFee;
    }

    public List<Stop> stops() {
        return stops;
    }
}
