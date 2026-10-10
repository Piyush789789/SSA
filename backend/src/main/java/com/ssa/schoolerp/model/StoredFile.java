package com.ssa.schoolerp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;

import java.time.LocalDateTime;

/**
 * An uploaded file (homework photo, document). Kept in the database so the nightly backup includes it.
 * The id is a random UUID, so a file can only be fetched by someone who was given its id.
 */
@Entity
@JsonFields
public class StoredFile implements Identifiable {

    public static final int MAX_BYTES = 5 * 1024 * 1024;

    @Id
    private String id;

    private String fileName;
    private String contentType;
    private long sizeBytes;
    private String ownerId;
    private LocalDateTime createdAt;

    @JsonIgnore
    @Basic(fetch = FetchType.LAZY)
    @Column(columnDefinition = "bytea")
    private byte[] content;

    protected StoredFile() {
    }

    public StoredFile(String id, String fileName, String contentType, String ownerId, LocalDateTime createdAt,
                      byte[] content) {
        this.id = id;
        this.fileName = fileName;
        this.contentType = contentType;
        this.sizeBytes = content.length;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
        this.content = content;
    }

    @Override
    public String id() {
        return id;
    }

    public String fileName() {
        return fileName;
    }

    public String contentType() {
        return contentType;
    }

    public long sizeBytes() {
        return sizeBytes;
    }

    public String ownerId() {
        return ownerId;
    }

    public byte[] content() {
        return content;
    }
}
