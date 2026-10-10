package com.ssa.schoolerp.service;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.ReferenceData;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.StudyMaterial;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Homework and study materials. Everyone sees the items of their classes; a teacher can post only for a
 * class and subject they teach and change only their own items; admins can change anything.
 */
@Service
public class ClassContentService {

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;

    public ClassContentService(DataStore store, AccessGuard guard, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- homework

    public List<Homework> homework(User user, String className, String subject) {
        Set<String> classes = readable(user, className);
        return store.homework.stream()
                .filter(h -> classes.contains(h.className()))
                .filter(h -> subject == null || h.subject().equals(subject))
                .sorted(Comparator.comparing(Homework::dueDate).reversed())
                .toList();
    }

    public Homework createHomework(User user, Homework request) {
        checkCanPost(user, request.className(), request.subject());
        LocalDate assigned = request.assignedDate() != null ? request.assignedDate() : LocalDate.now(clock);
        checkDueDate(assigned, request.dueDate());
        Homework homework = new Homework(store.nextId("HW"), request.title(), request.description(), request.subject(),
                request.className(), assigned, request.dueDate(), request.instructions(), attachmentsOf(request),
                user.actorId(), user.getName());
        return store.homework.save(homework);
    }

    public Homework updateHomework(User user, String id, Homework request) {
        Homework existing = store.homework.getById(id);
        checkOwner(user, existing.teacherId());
        checkCanPost(user, request.className(), request.subject());
        LocalDate assigned = request.assignedDate() != null ? request.assignedDate() : existing.assignedDate();
        checkDueDate(assigned, request.dueDate());
        Homework homework = new Homework(id, request.title(), request.description(), request.subject(),
                request.className(), assigned, request.dueDate(), request.instructions(), attachmentsOf(request),
                existing.teacherId(), existing.teacherName());
        return store.homework.save(homework);
    }

    public void deleteHomework(User user, String id) {
        checkOwner(user, store.homework.getById(id).teacherId());
        store.homework.deleteById(id);
    }

    // ---------------------------------------------------------------- study materials

    public List<StudyMaterial> materials(User user, String className, String subject, String category) {
        Set<String> classes = readable(user, className);
        return store.studyMaterials.stream()
                .filter(m -> classes.contains(m.className()))
                .filter(m -> subject == null || m.subject().equals(subject))
                .filter(m -> category == null || m.category().equals(category))
                .sorted(Comparator.comparing(StudyMaterial::uploadedDate).reversed())
                .toList();
    }

    public StudyMaterial createMaterial(User user, StudyMaterial request) {
        checkCanPost(user, request.className(), request.subject());
        checkCategory(request.category());
        StudyMaterial material = new StudyMaterial(store.nextId("MAT"), request.title(), request.subject(),
                request.className(), request.category(), LocalDate.now(clock), request.fileType(), request.fileSize(),
                user.actorId(), user.getName());
        return store.studyMaterials.save(material);
    }

    public void deleteMaterial(User user, String id) {
        checkOwner(user, store.studyMaterials.getById(id).teacherId());
        store.studyMaterials.deleteById(id);
    }

    // ---------------------------------------------------------------- checks

    private Set<String> readable(User user, String className) {
        if (className == null) {
            return guard.readableClasses(user);
        }
        guard.checkClassAccess(user, className);
        return Set.of(className);
    }

    private void checkCanPost(User user, String className, String subject) {
        store.classes.getById(className);
        if (!ReferenceData.SUBJECTS.contains(subject)) {
            throw ApiErrors.badRequest("Unknown subject: " + subject);
        }
        if (user.getRole() == Role.TEACHER && !guard.teacherOf(user).teaches(className, subject)) {
            throw ApiErrors.forbidden();
        }
    }

    private static void checkOwner(User user, String ownerId) {
        if (user.getRole() != Role.ADMIN && !user.actorId().equals(ownerId)) {
            throw ApiErrors.forbidden();
        }
    }

    private static void checkDueDate(LocalDate assigned, LocalDate due) {
        if (due.isBefore(assigned)) {
            throw ApiErrors.badRequest("Due date cannot be before the assigned date");
        }
    }

    private static void checkCategory(String category) {
        if (!ReferenceData.MATERIAL_CATEGORIES.contains(category)) {
            throw ApiErrors.badRequest("Unknown category: " + category + ". Use one of " + ReferenceData.MATERIAL_CATEGORIES);
        }
    }

    private static List<String> attachmentsOf(Homework request) {
        return request.attachments() == null ? List.of() : List.copyOf(request.attachments());
    }
}
