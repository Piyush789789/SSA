package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/** Persistent counter behind generated ids, so ids stay unique across restarts. */
@Entity
public class IdCounter implements Identifiable {

    @Id
    private String id;

    private long lastValue;

    protected IdCounter() {
    }

    public IdCounter(String id, long lastValue) {
        this.id = id;
        this.lastValue = lastValue;
    }

    @Override
    public String id() {
        return id;
    }

    public long next() {
        return ++lastValue;
    }
}
