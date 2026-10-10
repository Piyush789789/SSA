package com.ssa.schoolerp.security;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Decides which classes and students a user may see or change:
 * admins everything, teachers their assigned classes, students themselves, parents their children.
 */
@Component
public class AccessGuard {

    private final DataStore store;

    public AccessGuard(DataStore store) {
        this.store = store;
    }

    public Teacher teacherOf(User user) {
        return store.teachers.getById(user.getProfileId());
    }

    public Student studentOf(User user) {
        return store.students.getById(user.getProfileId());
    }

    public Parent parentOf(User user) {
        return store.parents.getById(user.getProfileId());
    }

    public List<Student> childrenOf(User user) {
        return parentOf(user).childIds().stream()
                .map(store.students::findById)
                .flatMap(Optional::stream)
                .toList();
    }

    public Set<String> readableClasses(User user) {
        return switch (user.getRole()) {
            case ADMIN -> store.classes.stream().map(SchoolClass::id).collect(Collectors.toSet());
            case TEACHER -> Set.copyOf(teacherOf(user).assignedClasses());
            case STUDENT -> Set.of(studentOf(user).className());
            case PARENT -> childrenOf(user).stream().map(Student::className).collect(Collectors.toSet());
        };
    }

    public Set<String> readableStudentIds(User user) {
        return switch (user.getRole()) {
            case ADMIN -> store.students.stream().map(Student::id).collect(Collectors.toSet());
            case TEACHER -> {
                Set<String> classes = readableClasses(user);
                yield store.students.stream()
                        .filter(s -> classes.contains(s.className()))
                        .map(Student::id)
                        .collect(Collectors.toSet());
            }
            case STUDENT -> Set.of(user.getProfileId());
            case PARENT -> Set.copyOf(parentOf(user).childIds());
        };
    }

    public Student checkStudentAccess(User user, String studentId) {
        Student student = store.students.getById(studentId);
        if (!readableStudentIds(user).contains(studentId)) {
            throw ApiErrors.forbidden();
        }
        return student;
    }

    public void checkClassAccess(User user, String className) {
        if (!readableClasses(user).contains(className)) {
            throw ApiErrors.forbidden();
        }
    }

    /** Admins manage every class; teachers only the classes assigned to them. */
    public void checkCanManageClass(User user, String className) {
        boolean allowed = switch (user.getRole()) {
            case ADMIN -> true;
            case TEACHER -> teacherOf(user).assignedClasses().contains(className);
            case STUDENT, PARENT -> false;
        };
        if (!allowed) {
            throw ApiErrors.forbidden();
        }
    }
}
