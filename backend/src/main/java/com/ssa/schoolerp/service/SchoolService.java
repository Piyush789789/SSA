package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.ClassView;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.ReferenceData;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.StudyMaterial;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.TimetableEntry;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/** Classes, students and teachers: the school's master data. */
@Service
public class SchoolService {

    private final DataStore store;
    private final AccessGuard guard;
    private final FeeService fees;

    public SchoolService(DataStore store, AccessGuard guard, FeeService fees) {
        this.store = store;
        this.guard = guard;
        this.fees = fees;
    }

    // ---------------------------------------------------------------- classes

    public List<ClassView> classes(User user) {
        Set<String> readable = guard.readableClasses(user);
        return store.classes.stream()
                .filter(c -> readable.contains(c.id()))
                .sorted(Comparator.comparingInt(SchoolClass::grade).thenComparing(SchoolClass::section))
                .map(this::view)
                .toList();
    }

    public ClassView classView(User user, String id) {
        SchoolClass schoolClass = store.classes.getById(id);
        guard.checkClassAccess(user, id);
        return view(schoolClass);
    }

    public ClassView createClass(SchoolClass request) {
        String id = SchoolClass.idFor(request.grade(), request.section());
        if (store.classes.existsById(id)) {
            throw ApiErrors.conflict("Class " + id + " already exists");
        }
        checkTeacherExists(request.classTeacherId());
        SchoolClass created = new SchoolClass(id, request.grade(), request.section(), request.classTeacherId(),
                request.room(), request.academicYear() == null ? ReferenceData.ACADEMIC_YEAR : request.academicYear());
        return view(store.classes.save(created));
    }

    /** Room, class teacher and academic year can change; grade and section form the id and cannot. */
    public ClassView updateClass(String id, SchoolClass request) {
        SchoolClass existing = store.classes.getById(id);
        checkTeacherExists(request.classTeacherId());
        SchoolClass updated = new SchoolClass(id, existing.grade(), existing.section(), request.classTeacherId(),
                request.room(), request.academicYear() == null ? existing.academicYear() : request.academicYear());
        return view(store.classes.save(updated));
    }

    public void deleteClass(String id) {
        store.classes.getById(id);
        if (!store.studentsOf(id).isEmpty()) {
            throw ApiErrors.conflict("Class " + id + " still has students; move them first");
        }
        store.teachers.findWhere(t -> t.assignedClasses().contains(id)).forEach(t -> store.teachers.save(
                withClasses(t, t.assignedClasses().stream().filter(c -> !c.equals(id)).toList())));
        store.timetable.deleteWhere(e -> e.className().equals(id));
        store.classes.deleteById(id);
    }

    private ClassView view(SchoolClass c) {
        String teacherName = store.teachers.findById(c.classTeacherId()).map(Teacher::name).orElse(null);
        return new ClassView(c.id(), c.grade(), c.section(), c.room(), c.academicYear(), c.classTeacherId(),
                teacherName, store.studentsOf(c.id()).size());
    }

    private void checkTeacherExists(String teacherId) {
        if (teacherId != null) {
            store.teachers.getById(teacherId);
        }
    }

    // ---------------------------------------------------------------- students

    public List<Student> students(User user, String className, String query) {
        if (className != null) {
            guard.checkClassAccess(user, className);
        }
        Set<String> readable = guard.readableStudentIds(user);
        Map<String, Integer> grades = store.classes.stream()
                .collect(Collectors.toMap(SchoolClass::id, SchoolClass::grade));
        String q = query == null ? null : query.trim().toLowerCase(Locale.ROOT);
        return store.students.stream()
                .filter(s -> readable.contains(s.id()))
                .filter(s -> className == null || s.className().equals(className))
                .filter(s -> q == null || q.isEmpty() || s.name().toLowerCase(Locale.ROOT).contains(q)
                        || s.id().toLowerCase(Locale.ROOT).contains(q))
                .sorted(Comparator.<Student>comparingInt(s -> grades.getOrDefault(s.className(), 0))
                        .thenComparing(Student::className)
                        .thenComparing(Student::rollNumber))
                .toList();
    }

    public synchronized Student createStudent(Student request) {
        store.classes.getById(request.className());
        int roll = request.rollNumber() != null ? request.rollNumber() : nextRollNumber(request.className());
        checkRollNumberFree(request.className(), roll, null);
        Student student = request.withIdAndRollNumber(store.nextId("STU-2026"), roll);
        store.students.save(student);
        fees.billNewStudent(student);
        return student;
    }

    public synchronized Student updateStudent(String id, Student request) {
        Student existing = store.students.getById(id);
        store.classes.getById(request.className());
        int roll = request.rollNumber() != null ? request.rollNumber() : existing.rollNumber();
        if (!request.className().equals(existing.className()) && request.rollNumber() == null) {
            roll = nextRollNumber(request.className());
        }
        checkRollNumberFree(request.className(), roll, id);
        return store.students.save(request.withIdAndRollNumber(id, roll));
    }

    /** Removes the student and their records. Fee payments are kept as financial history. */
    public synchronized void deleteStudent(String id) {
        store.students.getById(id);
        store.attendance.deleteWhere(r -> r.studentId().equals(id));
        store.marks.deleteWhere(m -> m.studentId().equals(id));
        store.concessions.deleteWhere(c -> c.studentId().equals(id));
        store.feeDues.deleteWhere(d -> d.studentId().equals(id));
        for (Parent parent : store.parents.findWhere(p -> p.childIds().contains(id))) {
            List<String> remaining = new ArrayList<>(parent.childIds());
            remaining.remove(id);
            store.parents.save(parent.withChildIds(remaining));
        }
        store.students.deleteById(id);
    }

    private int nextRollNumber(String className) {
        return store.studentsOf(className).stream().mapToInt(Student::rollNumber).max().orElse(0) + 1;
    }

    private void checkRollNumberFree(String className, int roll, String ownId) {
        boolean taken = store.studentsOf(className).stream()
                .anyMatch(s -> s.rollNumber() == roll && !s.id().equals(ownId));
        if (taken) {
            throw ApiErrors.conflict("Roll number " + roll + " is already used in class " + className);
        }
    }

    // ---------------------------------------------------------------- teachers

    public List<Teacher> teachers() {
        return store.teachers.stream().sorted(Comparator.comparing(Teacher::name)).toList();
    }

    public Teacher createTeacher(Teacher request) {
        validateTeacher(request, null);
        return store.teachers.save(request.withId(store.nextId("TCH-2026")));
    }

    /** Also renames the teacher everywhere their name is copied, so a rename never breaks a timetable. */
    public Teacher updateTeacher(String id, Teacher request) {
        Teacher existing = store.teachers.getById(id);
        validateTeacher(request, id);
        Teacher updated = store.teachers.save(request.withId(id));
        if (!Objects.equals(existing.name(), updated.name())) {
            store.timetable.findWhere(e -> id.equals(e.teacherId())).forEach(e -> store.timetable.save(
                    new TimetableEntry(e.id(), e.className(), e.day(), e.periodId(),
                            e.subject(), id, updated.name(), e.room())));
            store.homework.findWhere(h -> id.equals(h.teacherId())).forEach(h -> store.homework.save(
                    new Homework(h.id(), h.title(), h.description(), h.subject(),
                            h.className(), h.assignedDate(), h.dueDate(), h.instructions(), h.attachments(), id,
                            updated.name())));
            store.studyMaterials.findWhere(m -> id.equals(m.teacherId())).forEach(m -> store.studyMaterials.save(
                    new StudyMaterial(m.id(), m.title(), m.subject(), m.className(),
                            m.category(), m.uploadedDate(), m.fileType(), m.fileSize(), id, updated.name())));
        }
        return updated;
    }

    public void deleteTeacher(String id) {
        store.teachers.getById(id);
        store.classes.findWhere(c -> id.equals(c.classTeacherId()))
                .forEach(c -> store.classes.save(c.withClassTeacherId(null)));
        store.timetable.deleteWhere(e -> id.equals(e.teacherId()));
        store.teachers.deleteById(id);
    }

    private void validateTeacher(Teacher teacher, String ownId) {
        teacher.assignedClasses().forEach(store.classes::getById);
        teacher.subjects().stream()
                .filter(s -> !ReferenceData.SUBJECTS.contains(s))
                .findFirst()
                .ifPresent(s -> {
                    throw ApiErrors.badRequest("Unknown subject: " + s);
                });
        boolean emailTaken = store.teachers.stream()
                .anyMatch(t -> !t.id().equals(ownId) && t.email().equalsIgnoreCase(teacher.email()));
        if (emailTaken) {
            throw ApiErrors.conflict("Another teacher already uses " + teacher.email());
        }
    }

    private static Teacher withClasses(Teacher t, List<String> classes) {
        return new Teacher(t.id(), t.name(), t.email(), t.phone(), t.qualification(), t.experience(), t.joiningDate(),
                t.subjects(), classes);
    }
}
