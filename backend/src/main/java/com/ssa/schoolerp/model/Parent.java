package com.ssa.schoolerp.model;

import java.util.List;

public record Parent(
        String id,
        String name,
        String email,
        String phone,
        String relation,
        List<String> childIds) implements Identifiable {

    public Parent withChildIds(List<String> newChildIds) {
        return new Parent(id, name, email, phone, relation, newChildIds);
    }
}
