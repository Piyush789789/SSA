package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.AttendanceDtos.ClassDaySummary;
import com.ssa.schoolerp.dto.AttendanceDtos.Entry;
import com.ssa.schoolerp.dto.AttendanceDtos.LowAttendance;
import com.ssa.schoolerp.dto.AttendanceDtos.SaveRequest;
import com.ssa.schoolerp.dto.AttendanceDtos.Stats;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.AttendanceRecord;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    /** Students below this attendance rate (percent) are flagged. */
    public static final double LOW_ATTENDANCE_THRESHOLD = 75.0;

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;

    public AttendanceService(DataStore store, AccessGuard guard, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
    }

    public List<AttendanceRecord> find(User user, String className, String studentId, LocalDate from, LocalDate to) {
        if (studentId != null) {
            guard.checkStudentAccess(user, studentId);
        }
        if (className != null) {
            guard.checkClassAccess(user, className);
        }
        Set<String> visible = guard.readableStudentIds(user);
        return store.attendance.stream()
                .filter(r -> visible.contains(r.studentId()))
                .filter(r -> studentId == null || r.studentId().equals(studentId))
                .filter(r -> className == null || r.className().equals(className))
                .filter(r -> inRange(r.date(), from, to))
                .sorted(Comparator.comparing(AttendanceRecord::date).reversed()
                        .thenComparing(AttendanceRecord::studentId))
                .toList();
    }

    /** Marks a class for a day. Re-marking overwrites the earlier records for those students. */
    public List<AttendanceRecord> save(User user, SaveRequest request) {
        store.classes.getById(request.className());
        guard.checkCanManageClass(user, request.className());
        if (request.date().isAfter(LocalDate.now(clock))) {
            throw ApiErrors.badRequest("Attendance cannot be marked for a future date");
        }

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
        records.forEach(store.attendance::save);
        return records;
    }

    public Stats statsForStudent(User user, String studentId, LocalDate from, LocalDate to) {
        guard.checkStudentAccess(user, studentId);
        return summarize(store.attendance.findWhere(r -> r.studentId().equals(studentId) && inRange(r.date(), from, to)));
    }

    /** Per-class summaries for a day, limited to the classes the user can see. Empty classes are skipped. */
    public List<ClassDaySummary> daySummaries(User user, LocalDate date, String className) {
        if (className != null) {
            guard.checkClassAccess(user, className);
            return List.of(daySummary(store.classes.getById(className).id(), date));
        }
        Set<String> classes = guard.readableClasses(user);
        return store.classes.stream()
                .filter(c -> classes.contains(c.id()))
                .map(c -> daySummary(c.id(), date))
                .filter(summary -> summary.totalStudents() > 0)
                .toList();
    }

    public ClassDaySummary daySummary(String className, LocalDate date) {
        List<Student> roster = store.studentsOf(className);
        Set<String> rosterIds = roster.stream().map(Student::id).collect(Collectors.toSet());
        List<AttendanceRecord> records = store.attendance.findWhere(r -> r.date().equals(date) && rosterIds.contains(r.studentId()));
        return toDaySummary(className, date, roster.size(), records);
    }

    /** The whole school's attendance for a day. */
    public ClassDaySummary schoolSummary(LocalDate date) {
        List<AttendanceRecord> records = store.attendance.findWhere(r -> r.date().equals(date));
        return toDaySummary("ALL", date, store.students.count(), records);
    }

    public List<LowAttendance> lowAttendance(Collection<Student> students) {
        Map<String, List<AttendanceRecord>> byStudent = store.attendance.stream()
                .collect(Collectors.groupingBy(AttendanceRecord::studentId));
        return students.stream()
                .map(s -> new LowAttendance(s.id(), s.name(), s.className(),
                        summarize(byStudent.getOrDefault(s.id(), List.of())).rate()))
                .filter(low -> low.rate() != null && low.rate() < LOW_ATTENDANCE_THRESHOLD)
                .sorted(Comparator.comparing(LowAttendance::rate))
                .toList();
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
                                                List<AttendanceRecord> records) {
        Stats stats = summarize(records);
        int marked = (int) records.stream().map(AttendanceRecord::studentId).distinct().count();
        return new ClassDaySummary(className, date, totalStudents, stats.present(), stats.absent(), stats.late(),
                stats.leave(), Math.max(0, totalStudents - marked), stats.rate());
    }

    private static boolean inRange(LocalDate date, LocalDate from, LocalDate to) {
        return (from == null || !date.isBefore(from)) && (to == null || !date.isAfter(to));
    }
}
