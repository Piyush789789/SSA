package com.ssa.schoolerp.service;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.repository.DataStore;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * End-of-year promotion: every active student moves up one class (5-B → 6-B), class 10 graduates, and detained
 * students stay where they are. Roll numbers are then renumbered alphabetically in every class, and the school's
 * current academic year advances. Attendance, marks and fee history keep the class they were recorded in.
 */
@Service
@Transactional
public class PromotionService {

    public static final int HIGHEST_GRADE = 10;

    public record PromotionRequest(
            @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}", message = "Academic year must look like 2027-28") String toAcademicYear,
            List<String> detainedStudentIds,
            boolean dryRun) {
    }

    public record ClassMove(String fromClass, String toClass, int students) {
    }

    public record PromotionResult(String fromAcademicYear, String toAcademicYear, int promoted, int graduated,
                                  int detained, List<ClassMove> moves, boolean dryRun) {
    }

    private final DataStore store;
    private final SettingsService settings;

    public PromotionService(DataStore store, SettingsService settings) {
        this.store = store;
        this.settings = settings;
    }

    public synchronized PromotionResult promote(PromotionRequest request) {
        String fromYear = settings.currentAcademicYear();
        if (request.toAcademicYear().equals(fromYear)) {
            throw ApiErrors.badRequest("The school is already in " + fromYear);
        }
        Set<String> detained = new HashSet<>(request.detainedStudentIds() == null ? List.of() : request.detainedStudentIds());
        List<Student> active = store.students.where(Student.ACTIVE_CONDITION);
        detained.forEach(id -> {
            if (active.stream().noneMatch(s -> s.id().equals(id))) {
                throw ApiErrors.badRequest("Student " + id + " is not an active student");
            }
        });

        // Work out every move first; nothing is saved on a dry run.
        Map<String, String> targetClass = new LinkedHashMap<>(); // studentId -> new class (null = graduates)
        Map<String, Integer> moveCounts = new TreeMap<>(Comparator.comparingInt(PromotionService::gradeOf)
                .thenComparing(Comparator.naturalOrder()));
        int graduated = 0;
        int promoted = 0;
        for (Student s : active) {
            if (detained.contains(s.id())) {
                continue;
            }
            int grade = gradeOf(s.className());
            String key;
            if (grade >= HIGHEST_GRADE) {
                targetClass.put(s.id(), null);
                key = s.className() + "→Graduated";
                graduated++;
            } else {
                String next = (grade + 1) + "-" + sectionOf(s.className());
                targetClass.put(s.id(), next);
                key = s.className() + "→" + next;
                promoted++;
            }
            moveCounts.merge(key, 1, Integer::sum);
        }
        List<ClassMove> moves = new ArrayList<>();
        moveCounts.forEach((key, count) -> {
            String[] parts = key.split("→");
            moves.add(new ClassMove(parts[0], parts[1], count));
        });
        PromotionResult result = new PromotionResult(fromYear, request.toAcademicYear(), promoted, graduated,
                detained.size(), moves, request.dryRun());
        if (request.dryRun()) {
            return result;
        }

        Set<String> touchedClasses = new HashSet<>();
        for (Student s : active) {
            if (!targetClass.containsKey(s.id())) {
                touchedClasses.add(s.className()); // detained: stays, but the class is renumbered
                continue;
            }
            String next = targetClass.get(s.id());
            if (next == null) {
                store.students.save(s.withStatus(Student.GRADUATED));
            } else {
                ensureClassExists(next, request.toAcademicYear());
                store.students.save(s.withClass(next, s.rollNumber())); // roll numbers are reassigned below
                touchedClasses.add(next);
            }
        }
        touchedClasses.forEach(this::renumber);
        store.classes.stream().forEach(c -> store.classes.save(new SchoolClass(c.id(), c.grade(), c.section(),
                c.classTeacherId(), c.room(), request.toAcademicYear())));
        store.settings.save(settings.get().withAcademicYear(request.toAcademicYear()));
        return result;
    }

    /** Roll numbers 1..n in alphabetical order, as schools usually do at the start of a year. */
    private void renumber(String className) {
        List<Student> students = new ArrayList<>(store.studentsOf(className));
        students.sort(Comparator.comparing(Student::name, String.CASE_INSENSITIVE_ORDER));
        for (int i = 0; i < students.size(); i++) {
            store.students.save(students.get(i).withClass(className, i + 1));
        }
    }

    private void ensureClassExists(String classId, String academicYear) {
        if (!store.classes.existsById(classId)) {
            int grade = gradeOf(classId);
            store.classes.save(new SchoolClass(classId, grade, sectionOf(classId), null, null, academicYear));
        }
    }

    static int gradeOf(String className) {
        try {
            return Integer.parseInt(className.substring(0, className.indexOf('-')));
        } catch (RuntimeException e) {
            throw ApiErrors.badRequest("Unexpected class name: " + className);
        }
    }

    private static String sectionOf(String className) {
        return className.substring(className.indexOf('-') + 1);
    }
}
