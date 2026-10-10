package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.AttendanceDtos.ClassDaySummary;
import com.ssa.schoolerp.dto.AttendanceDtos.Entry;
import com.ssa.schoolerp.dto.AttendanceDtos.LowAttendance;
import com.ssa.schoolerp.dto.AttendanceDtos.SaveRequest;
import com.ssa.schoolerp.dto.AttendanceDtos.Stats;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.AttendanceRecord;
import com.ssa.schoolerp.model.AttendanceStatus;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class AttendanceService {

    /** Students below this attendance rate (percent) are flagged. */
    public static final double LOW_ATTENDANCE_THRESHOLD = 75.0;

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;
    private final NotificationService notifications;
    private final CalendarService calendar;

    public AttendanceService(DataStore store, AccessGuard guard, Clock clock, NotificationService notifications,
                             CalendarService calendar) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.notifications = notifications;
        this.calendar = calendar;
    }

    public List<AttendanceRecord> find(User user, String className, String studentId, LocalDate from, LocalDate to) {
        if (studentId != null) {
            guard.checkStudentAccess(user, studentId);
        }
        if (className != null) {
            guard.checkClassAccess(user, className);
        }
        // Built as one database query so only the matching rows are read (the table grows by every student, every day).
        List<String> conditions = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        switch (user.getRole()) {
            case ADMIN -> {
                // sees everything
            }
            case TEACHER -> addCondition(conditions, params, "e.className in ?", guard.readableClasses(user));
            case STUDENT, PARENT -> addCondition(conditions, params, "e.studentId in ?", guard.readableStudentIds(user));
        }
        if (studentId != null) addCondition(conditions, params, "e.studentId = ?", studentId);
        if (className != null) addCondition(conditions, params, "e.className = ?", className);
        if (from != null) addCondition(conditions, params, "e.date >= ?", from);
        if (to != null) addCondition(conditions, params, "e.date <= ?", to);
        String where = conditions.isEmpty() ? "1 = 1" : String.join(" and ", conditions);
        return store.attendance.where(where + " order by e.date desc, e.studentId", params.toArray());
    }

    /** Appends "condition" with its "?" turned into the next positional parameter. */
    private static void addCondition(List<String> conditions, List<Object> params, String condition, Object value) {
        params.add(value);
        conditions.add(condition.replace("?", "?" + params.size()));
    }

    /** Marks a class for a day. Re-marking overwrites the earlier records for those students. */
    public List<AttendanceRecord> save(User user, SaveRequest request) {
        store.classes.getById(request.className());
        guard.checkCanManageClass(user, request.className());
        if (request.date().isAfter(LocalDate.now(clock))) {
            throw ApiErrors.badRequest("Attendance cannot be marked for a future date");
        }
        calendar.holidayOn(request.date()).ifPresent(holiday -> {
            throw ApiErrors.badRequest(request.date() + " is a holiday (" + holiday + "); attendance is not taken");
        });

        Map<String, Student> roster = store.studentsOf(request.className()).stream()
                .collect(Collectors.toMap(Student::id, Function.identity()));
        Set<String> seen = new HashSet<>();
        List<AttendanceRecord> records = new ArrayList<>();
        for (Entry entry : request.entries()) {
            Student student = roster.get(entry.studentId());
            if (student == null) {
                throw ApiErrors.badRequest("Student " + entry.studentId() + " is not in class " + request.className());
            }
            if (!seen.add(student.id())) {
                throw ApiErrors.badRequest("Student " + student.id() + " appears more than once");
            }
            records.add(new AttendanceRecord(AttendanceRecord.idFor(student.id(), request.date()), student.id(),
                    student.className(), request.date(), entry.status(), entry.checkInTime(), entry.remarks(),
                    user.getName()));
        }
        // Families hear about a new absence once; re-saving the same day does not repeat the alert.
        Set<String> alreadyAbsent = store.attendance.where("e.className = ?1 and e.date = ?2 and e.status = ?3",
                        request.className(), request.date(), AttendanceStatus.ABSENT).stream()
                .map(AttendanceRecord::studentId)
                .collect(Collectors.toSet());
        records.forEach(store.attendance::save);
        for (AttendanceRecord r : records) {
            if (r.status() == AttendanceStatus.ABSENT && !alreadyAbsent.contains(r.studentId())) {
                Student student = roster.get(r.studentId());
                notifications.notifyFamily(student, "Absent " + (r.date().equals(LocalDate.now(clock)) ? "today" : "on " + r.date()),
                        student.name() + " was marked absent on " + r.date() + ".", NotificationService.ATTENDANCE,
                        "/attendance", true);
            }
        }
        return records;
    }

    public Stats statsForStudent(User user, String studentId, LocalDate from, LocalDate to) {
        guard.checkStudentAccess(user, studentId);
        List<String> conditions = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        addCondition(conditions, params, "e.studentId = ?", studentId);
        if (from != null) addCondition(conditions, params, "e.date >= ?", from);
        if (to != null) addCondition(conditions, params, "e.date <= ?", to);
        List<Object[]> rows = store.attendance.aggregate(
                "select e.status, count(e) from %s e where " + String.join(" and ", conditions) + " group by e.status",
                params.toArray());
        return statsFromCounts(countsByStatus(rows, 0, 1));
    }

    /** Per-class summaries for a day, limited to the classes the user can see. Empty classes are skipped. */
    public List<ClassDaySummary> daySummaries(User user, LocalDate date, String className) {
        if (className != null) {
            guard.checkClassAccess(user, className);
            return List.of(daySummary(store.classes.getById(className).id(), date));
        }
        Set<String> classes = guard.readableClasses(user);
        Map<String, Integer> studentCounts = store.studentCountsByClass();
        // One grouped query for every class at once, instead of one scan of the table per class.
        Map<String, Map<AttendanceStatus, Long>> countsByClass = new HashMap<>();
        for (Object[] row : store.attendance.aggregate(
                "select e.className, e.status, count(e) from %s e where e.date = ?1 group by e.className, e.status", date)) {
            countsByClass.computeIfAbsent((String) row[0], c -> new EnumMap<>(AttendanceStatus.class))
                    .put((AttendanceStatus) row[1], (Long) row[2]);
        }
        return store.classes.stream()
                .filter(c -> classes.contains(c.id()) && studentCounts.getOrDefault(c.id(), 0) > 0)
                .map(c -> toDaySummary(c.id(), date, studentCounts.get(c.id()),
                        countsByClass.getOrDefault(c.id(), Map.of())))
                .toList();
    }

    public ClassDaySummary daySummary(String className, LocalDate date) {
        int total = store.studentCountsByClass().getOrDefault(className, 0);
        List<Object[]> rows = store.attendance.aggregate(
                "select e.status, count(e) from %s e where e.className = ?1 and e.date = ?2 group by e.status",
                className, date);
        return toDaySummary(className, date, total, countsByStatus(rows, 0, 1));
    }

    /** The whole school's attendance for a day. */
    public ClassDaySummary schoolSummary(LocalDate date) {
        List<Object[]> rows = store.attendance.aggregate(
                "select e.status, count(e) from %s e where e.date = ?1 group by e.status", date);
        return toDaySummary("ALL", date, store.students.count(), countsByStatus(rows, 0, 1));
    }

    public List<LowAttendance> lowAttendance(Collection<Student> students) {
        // Per-student status counts, grouped by the database: a few rows per student instead of every record.
        Map<String, Map<AttendanceStatus, Long>> byStudent = new HashMap<>();
        for (Object[] row : store.attendance.aggregate(
                "select e.studentId, e.status, count(e) from %s e group by e.studentId, e.status")) {
            byStudent.computeIfAbsent((String) row[0], s -> new EnumMap<>(AttendanceStatus.class))
                    .put((AttendanceStatus) row[1], (Long) row[2]);
        }
        return students.stream()
                .map(s -> new LowAttendance(s.id(), s.name(), s.className(),
                        statsFromCounts(byStudent.getOrDefault(s.id(), Map.of())).rate()))
                .filter(low -> low.rate() != null && low.rate() < LOW_ATTENDANCE_THRESHOLD)
                .sorted(Comparator.comparing(LowAttendance::rate))
                .toList();
    }

    private static Map<AttendanceStatus, Long> countsByStatus(List<Object[]> rows, int statusColumn, int countColumn) {
        Map<AttendanceStatus, Long> counts = new EnumMap<>(AttendanceStatus.class);
        rows.forEach(row -> counts.put((AttendanceStatus) row[statusColumn], (Long) row[countColumn]));
        return counts;
    }

    /** Same rules as {@link #summarize}: holidays are not working days, late counts as attended. */
    static Stats statsFromCounts(Map<AttendanceStatus, Long> counts) {
        int present = counts.getOrDefault(AttendanceStatus.PRESENT, 0L).intValue();
        int absent = counts.getOrDefault(AttendanceStatus.ABSENT, 0L).intValue();
        int late = counts.getOrDefault(AttendanceStatus.LATE, 0L).intValue();
        int leave = counts.getOrDefault(AttendanceStatus.LEAVE, 0L).intValue();
        int workingDays = present + absent + late + leave;
        Double rate = workingDays == 0 ? null : Grading.round1((present + late) * 100.0 / workingDays);
        return new Stats(workingDays, present, absent, late, leave, rate);
    }

    public static Stats summarize(Collection<AttendanceRecord> records) {
        int present = 0;
        int absent = 0;
        int late = 0;
        int leave = 0;
        for (AttendanceRecord record : records) {
            switch (record.status()) {
                case PRESENT -> present++;
                case ABSENT -> absent++;
                case LATE -> late++;
                case LEAVE -> leave++;
                case HOLIDAY -> {
                    // not a working day
                }
            }
        }
        int workingDays = present + absent + late + leave;
        Double rate = workingDays == 0 ? null : Grading.round1((present + late) * 100.0 / workingDays);
        return new Stats(workingDays, present, absent, late, leave, rate);
    }

    private static ClassDaySummary toDaySummary(String className, LocalDate date, int totalStudents,
                                                Map<AttendanceStatus, Long> counts) {
        Stats stats = statsFromCounts(counts);
        // One record per student per day, so the number of records is the number of students marked.
        int marked = (int) counts.values().stream().mapToLong(Long::longValue).sum();
        return new ClassDaySummary(className, date, totalStudents, stats.present(), stats.absent(), stats.late(),
                stats.leave(), Math.max(0, totalStudents - marked), stats.rate());
    }
}
