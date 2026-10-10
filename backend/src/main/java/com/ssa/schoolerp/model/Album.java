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
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** An event photo album (Sports Day, Annual Function...). Photos are {@link StoredFile} ids. */
@Entity
@JsonFields
public class Album implements Identifiable {

    @Id
    private String id;

    @NotBlank
    @Size(max = 120)
    private String title;

    @NotNull
    private LocalDate eventDate;

    @Column(length = 2000)
    @Size(max = 2000)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "album_photo", joinColumns = @JoinColumn(name = "album_id"))
    @Column(name = "file_id")
    @OrderColumn(name = "position")
    private List<String> photoIds = new ArrayList<>();

    private String createdBy;

    protected Album() {
    }

    public Album(String id, String title, LocalDate eventDate, String description, List<String> photoIds,
                 String createdBy) {
        this.id = id;
        this.title = title;
        this.eventDate = eventDate;
        this.description = description;
        this.photoIds = new ArrayList<>(photoIds);
        this.createdBy = createdBy;
    }

    @Override
    public String id() {
        return id;
    }

    public String title() {
        return title;
    }

    public LocalDate eventDate() {
        return eventDate;
    }

    public String description() {
        return description;
    }

    public List<String> photoIds() {
        return photoIds;
    }

    public String createdBy() {
        return createdBy;
    }
}
