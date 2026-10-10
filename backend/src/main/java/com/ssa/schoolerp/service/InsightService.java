package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.CampusDtos.AtRiskStudent;
import com.ssa.schoolerp.model.AttendanceStatus;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.MarksRecord;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Early warning: students whose attendance, marks, homework or fees suggest they need attention.
 * Each signal adds to a score; students scoring {@value #MIN_SCORE} or more are listed, most urgent first.
 */
@Service
@Transactional(readOnly = true)
public class InsightService {

    static final int MIN_SCORE = 2;
    private static final int WINDOW_DAYS = 30;

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;

    public InsightService(DataStore store, AccessGuard guard, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
    }

    /** Admins: the whole school (or one class); teachers: their classes. */
    public List<AtRiskStudent> atRisk(User user, String className) {
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.TEACHER) {
            throw com.ssa.schoolerp.exception.ApiErrors.forbidden();
        }
        if (className != null) guard.checkClassAccess(user, className);
        Set<String> classes = className != null ? Set.of(className) : guard.readableClasses(user);
        LocalDate today = LocalDate.now(clock);
        LocalDate from = today.minusDays(WINDOW_DAYS);

        List<Student> students = store.students.where("e.className in ?1 and " + Student.ACTIVE_CONDITION, classes);
        if (students.isEmpty()) return List.of();
        Set<String> ids = students.stream().map(Student::id).collect(Collectors.toSet());

        // Attendance over the last 30 days, counted by the database.
        Map<String, Map<AttendanceStatus, Long>> attendance = new HashMap<>();
        for (Object[] row : store.attendance.aggregate(
                "select e.studentId, e.status, count(e) from %s e where e.date >= ?1 and e.className in ?2 "
                        + "group by e.studentId, e.status", from, classes)) {
            attendance.computeIfAbsent((String) row[0], k -> new EnumMap<>(AttendanceStatus.class))
                    .put((AttendanceStatus) row[1], (Long) row[2]);
        }

        // Marks this academic year: average percentage and subjects below 33%.
        Map<String, double[]> marks = new HashMap<>(); // obtained, max
        Map<String, Set<String>> weakSubjects = new HashMap<>();
        for (MarksRecord m : store.marks.where("e.className in ?1", classes)) {
            if (m.obtainedMarks() == null || m.absent() || m.maxMarks() <= 0) continue;
            double[] totals = marks.computeIfAbsent(m.studentId(), k -> new double[2]);
            totals[0] += m.obtainedMarks();
            totals[1] += m.maxMarks();
            if (m.obtainedMarks() * 100.0 / m.maxMarks() < 33) {
                weakSubjects.computeIfAbsent(m.studentId(), k -> new HashSet<>()).add(m.subject());
            }
        }

        // Fees more than a week overdue.
        Map<String, Long> overdue = new HashMap<>();
        for (FeeDue due : store.feeDues.where("e.studentId in ?1 and e.dueDate < ?2 and e.paid + e.concession < e.amount",
                ids, today.minusDays(7))) {
            overdue.merge(due.studentId(), due.pending(), Long::sum);
        }

        // Homework due in the last 30 days that was never handed in. Only counted for classes that use submissions.
        Map<String, Integer> missing = new HashMap<>();
        List<Homework> recent = store.homework.where("e.className in ?1 and e.dueDate >= ?2 and e.dueDate < ?3",
                classes, from, today);
        Set<String> classesUsingSubmissions = new HashSet<>();
        Map<String, Set<String>> submitted = new HashMap<>();
        if (!recent.isEmpty()) {
            Map<String, String> homeworkClass = recent.stream().collect(Collectors.toMap(Homework::id, Homework::className));
            store.submissions.where("e.homeworkId in ?1", homeworkClass.keySet()).forEach(s -> {
                submitted.computeIfAbsent(s.studentId(), k -> new HashSet<>()).add(s.homeworkId());
                classesUsingSubmissions.add(homeworkClass.get(s.homeworkId()));
            });
            for (Student s : students) {
                if (!classesUsingSubmissions.contains(s.className())) continue;
                Set<String> done = submitted.getOrDefault(s.id(), Set.of());
                int count = (int) recent.stream()
                        .filter(h -> h.className().equals(s.className()) && !done.contains(h.id())).count();
                if (count > 0) missing.put(s.id(), count);
            }
        }

        List<AtRiskStudent> result = new ArrayList<>();
        for (Student s : students) {
            List<String> reasons = new ArrayList<>();
            int score = 0;
            Double rate = AttendanceService.statsFromCounts(attendance.getOrDefault(s.id(), Map.of())).rate();
            if (rate != null && rate < 60) {
                score += 3;
                reasons.add("Attendance " + rate + "% in the last 30 days");
            } else if (rate != null && rate < AttendanceService.LOW_ATTENDANCE_THRESHOLD) {
                score += 2;
                reasons.add("Attendance " + rate + "% in the last 30 days");
            }
            double[] totals = marks.get(s.id());
            Double average = totals == null || totals[1] == 0 ? null : Grading.round1(totals[0] * 100 / totals[1]);
            if (average != null && average < 40) {
                score += 2;
                reasons.add("Average marks " + average + "%");
            }
            Set<String> weak = weakSubjects.getOrDefault(s.id(), Set.of());
            if (weak.size() >= 2) {
                score += 1;
                reasons.add("Below 33% in " + String.join(", ", weak.stream().sorted().toList()));
            }
            int missed = missing.getOrDefault(s.id(), 0);
            if (missed >= 3) {
                score += 1;
                reasons.add(missed + " homework not submitted");
            }
            long fees = overdue.getOrDefault(s.id(), 0L);
            if (fees > 0) {
                score += 1;
                reasons.add("Fees of Rs " + fees + " overdue");
            }
            if (score >= MIN_SCORE) {
                result.add(new AtRiskStudent(s.id(), s.name(), s.className(), s.rollNumber(), score, reasons, rate,
                        average, fees, missed));
            }
        }
        result.sort(Comparator.comparingInt(AtRiskStudent::score).reversed().thenComparing(AtRiskStudent::name));
        return result;
    }
}
