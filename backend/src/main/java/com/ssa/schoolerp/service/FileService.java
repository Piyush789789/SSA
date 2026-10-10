package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.OperationsDtos.UploadedFile;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.StoredFile;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/** Uploads (homework photos, PDFs), kept in the database. */
@Service
@Transactional
public class FileService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/heic",
            "image/heif", "application/pdf");

    private final DataStore store;
    private final Clock clock;

    public FileService(DataStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    public UploadedFile upload(User user, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiErrors.badRequest("Choose a file to upload");
        }
        if (file.getSize() > StoredFile.MAX_BYTES) {
            throw ApiErrors.badRequest("Files can be at most 5 MB; take the photo at a lower resolution");
        }
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(type)) {
            throw ApiErrors.badRequest("Only photos (JPEG, PNG, WebP, HEIC) and PDFs can be uploaded");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiErrors.badRequest("The upload could not be read; try again");
        }
        String name = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
        name = name.replaceAll("[\\\\/:*?\"<>|]", "_");
        if (name.length() > 120) name = name.substring(name.length() - 120);
        StoredFile stored = store.files.save(new StoredFile(UUID.randomUUID().toString(), name, type, user.actorId(),
                LocalDateTime.now(clock), bytes));
        return new UploadedFile(stored.id(), stored.fileName(), stored.contentType(), stored.sizeBytes());
    }

    public StoredFile get(String id) {
        return store.files.getById(id);
    }

    /** Checks that each id is a file this user uploaded (so nobody attaches someone else's file). */
    public void checkOwnFiles(User user, java.util.Collection<String> ids) {
        for (String id : ids) {
            StoredFile file = store.files.findById(id).orElseThrow(() -> ApiErrors.badRequest("Unknown file " + id));
            if (!file.ownerId().equals(user.actorId())) {
                throw ApiErrors.forbidden();
            }
        }
    }
}
