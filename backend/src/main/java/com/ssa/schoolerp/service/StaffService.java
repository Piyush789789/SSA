package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.OperationsDtos.CoverNeed;
import com.ssa.schoolerp.dto.OperationsDtos.FreeTeacher;
import com.ssa.schoolerp.dto.OperationsDtos.StaffAttendanceEntry;
import com.ssa.schoolerp.dto.OperationsDtos.StaffAttendanceRequest;
import com.ssa.schoolerp.dto.OperationsDtos.StaffDayRow;
import com.ssa.schoolerp.dto.OperationsDtos.StaffStats;
import com.ssa.schoolerp.dto.OperationsDtos.SubstitutionRequest;
import com.ssa.schoolerp.dto.OperationsDtos.TeacherPeriod;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.LeaveRequest;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.StaffAttendance;
import com.ssa.schoolerp.model.Substitution;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.TimetableEntry;
import com.ssa.schoolerp.model.TimetablePeriod;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Teachers' daily attendance (sheet by the office, or self check-in) and covering absent teachers' periods. */
@Service
@Transactional
public class StaffService {

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;
    private final LeaveService leaves;
    private final CalendarService calendar;
    private final TimetableService timetable;
    private final NotificationService notifications;

    public StaffService(DataStore store, AccessGuard guard, Clock clock, LeaveService leaves, CalendarService calendar,
                        TimetableService timetable, NotificationService notifications) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.leaves = leaves;
        this.calendar = calendar;
        this.timetable = timetable;
        this.notifications = notifications;
    }

    // ---------------------------------------------------------------- attendance

    /** Every teacher with that day's record (null if not marked) and any approved leave. */
    public List<StaffDayRow> daySheet(LocalDate date) {
        Map<String, StaffAttendance> records = store.staffAttendance.where("e.date = ?1", date).stream()
                .collect(Collectors.toMap(StaffAttendance::teacherId, Function.identity()));
        Map<String, String> onLeave = store.leaves.where(
                        "e.applicantType = ?1 and e.status = ?2 and e.fromDate <= ?3 and e.toDate >= ?3",
                        LeaveRequest.STAFF, LeaveRequest.APPROVED, date).stream()
                .collect(Collectors.toMap(LeaveRequest::personId, LeaveRequest::id, (a, b) -> a));
        return store.teachers.stream()
                .sorted(Comparator.comparing(Teacher::name))
                .map(t -> new StaffDayRow(t.id(), t.name(), t.phone(), t.subjects(), records.get(t.id()),
                        onLeave.get(t.id())))
                .toList();
    }

    public List<StaffAttendance> mark(User user, StaffAttendanceRequest request) {
        if (request.date().isAfter(LocalDate.now(clock))) {
            throw ApiErrors.badRequest("Attendance cannot be marked for a future date");
        }
        List<StaffAttendance> saved = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (StaffAttendanceEntry entry : request.entries()) {
            if (!seen.add(entry.teacherId())) {
                throw ApiErrors.badRequest("Teacher " + entry.teacherId() + " appears more than once");
            }
            Teacher teacher = store.teachers.getById(entry.teacherId());
            boolean away = StaffAttendance.ABSENT.equals(entry.status()) || StaffAttendance.LEAVE.equals(entry.status());
            saved.add(store.staffAttendance.save(new StaffAttendance(teacher.id(), teacher.name(), request.date(),
                    entry.status(), away ? null : entry.checkIn(), away ? null : entry.checkOut(), user.getName())));
        }
        return saved;
    }

    /** A teacher marks themself in on arrival (once a day). */
    public StaffAttendance checkIn(User user) {
        Teacher teacher = guard.teacherOf(user);
        LocalDate today = LocalDate.now(clock);
        calendar.holidayOn(today).ifPresent(h -> {
            throw ApiErrors.badRequest("Today is a holiday (" + h + ")");
        });
        StaffAttendance existing = store.staffAttendance.findById(StaffAttendance.idFor(teacher.id(), today)).orElse(null);
        if (existing != null && existing.checkIn() != null) {
            throw ApiErrors.conflict("Already checked in at " + existing.checkIn());
        }
        return store.staffAttendance.save(new StaffAttendance(teacher.id(), teacher.name(), today,
                StaffAttendance.PRESENT, now(), null, "Self check-in"));
    }

    public StaffAttendance checkOut(User user) {
        Teacher teacher = guard.teacherOf(user);
        LocalDate today = LocalDate.now(clock);
        StaffAttendance existing = store.staffAttendance.findById(StaffAttendance.idFor(teacher.id(), today))
                .filter(r -> r.checkIn() != null)
                .orElseThrow(() -> ApiErrors.badRequest("Check in first"));
        return store.staffAttendance.save(new StaffAttendance(teacher.id(), teacher.name(), today, existing.status(),
                existing.checkIn(), now(), "Self check-out"));
    }

    /** A teacher's records (admins: anyone's; teachers: their own), newest first. */
    public List<StaffAttendance> records(User user, String teacherId, LocalDate from, LocalDate to) {
        String id = teacherId != null ? teacherId : user.getProfileId();
        if (user.getRole() != Role.ADMIN && !user.actorId().equals(id)) {
            throw ApiErrors.forbidden();
        }
        store.teachers.getById(id);
        return store.staffAttendance.where("e.teacherId = ?1 and e.date >= ?2 and e.date <= ?3 order by e.date desc",
                id, from, to);
    }

    /** Monthly-report style counts per teacher over the range. Half days count as half present. */
    public List<StaffStats> report(LocalDate from, LocalDate to) {
        Map<String, Map<String, Long>> counts = new HashMap<>();
        for (Object[] row : store.staffAttendance.aggregate(
                "select e.teacherId, e.status, count(e) from %s e where e.date >= ?1 and e.date <= ?2 group by e.teacherId, e.status",
                from, to)) {
            counts.computeIfAbsent((String) row[0], k -> new HashMap<>()).put((String) row[1], (Long) row[2]);
        }
        return store.teachers.stream()
                .sorted(Comparator.comparing(Teacher::name))
                .map(t -> {
                    Map<String, Long> c = counts.getOrDefault(t.id(), Map.of());
                    int present = c.getOrDefault(StaffAttendance.PRESENT, 0L).intValue();
                    int absent = c.getOrDefault(StaffAttendance.ABSENT, 0L).intValue();
                    int leave = c.getOrDefault(StaffAttendance.LEAVE, 0L).intValue();
                    int half = c.getOrDefault(StaffAttendance.HALF_DAY, 0L).intValue();
                    int working = present + absent + leave + half;
                    Double rate = working == 0 ? null : Grading.round1((present + half * 0.5) * 100.0 / working);
                    return new StaffStats(t.id(), t.name(), working, present, absent, leave, half, rate);
                })
                .toList();
    }

    // ---------------------------------------------------------------- substitutions

    /** Teachers away that day: marked absent/on leave, or with approved leave. */
    public Set<String> awayTeachers(LocalDate date) {
        Set<String> away = new HashSet<>(leaves.staffOnLeave(date));
        store.staffAttendance.where("e.date = ?1", date).forEach(r -> {
            if (r.away()) {
                away.add(r.teacherId());
            } else {
                away.remove(r.teacherId()); // came in after all
            }
        });
        return away;
    }

    /** Every period of an away teacher that day, with its substitute (if assigned) and the teachers free then. */
    public List<CoverNeed> coverNeeds(LocalDate date) {
        Set<String> away = awayTeachers(date);
        if (away.isEmpty() || calendar.holidayOn(date).isPresent()) {
            return List.of();
        }
        List<TimetableEntry> dayEntries = store.timetable.where("e.day = ?1", date.getDayOfWeek());
        Map<String, Substitution> subs = store.substitutions.where("e.date = ?1", date).stream()
                .collect(Collectors.toMap(Substitution::id, Function.identity()));
        Map<String, TimetablePeriod> periods = timetable.periods().stream()
                .collect(Collectors.toMap(TimetablePeriod::id, Function.identity()));
        List<Teacher> teachers = store.teachers.findAll();

        // Busy = has a class of their own in that period, or is already covering one.
        Map<String, Set<String>> busyByPeriod = new HashMap<>();
        Map<String, Integer> loadByTeacher = new HashMap<>();
        for (TimetableEntry e : dayEntries) {
            if (e.teacherId() != null && !away.contains(e.teacherId())) {
                busyByPeriod.computeIfAbsent(e.periodId(), k -> new HashSet<>()).add(e.teacherId());
                loadByTeacher.merge(e.teacherId(), 1, Integer::sum);
            }
        }
        for (Substitution s : subs.values()) {
            busyByPeriod.computeIfAbsent(s.periodId(), k -> new HashSet<>()).add(s.substituteTeacherId());
            loadByTeacher.merge(s.substituteTeacherId(), 1, Integer::sum);
        }

        List<CoverNeed> needs = new ArrayList<>();
        for (TimetableEntry e : dayEntries) {
            if (e.teacherId() == null || !away.contains(e.teacherId())) continue;
            TimetablePeriod period = periods.get(e.periodId());
            if (period == null) continue;
            Set<String> busy = busyByPeriod.getOrDefault(e.periodId(), Set.of());
            List<FreeTeacher> free = teachers.stream()
                    .filter(t -> !away.contains(t.id()) && !busy.contains(t.id()))
                    .map(t -> new FreeTeacher(t.id(), t.name(), t.subjects().contains(e.subject()),
                            t.assignedClasses().contains(e.className()), loadByTeacher.getOrDefault(t.id(), 0)))
                    .sorted(Comparator.comparing((FreeTeacher f) -> !f.teachesSubject())
                            .thenComparing(f -> !f.teachesClass())
                            .thenComparingInt(FreeTeacher::periodsToday)
                            .thenComparing(FreeTeacher::name))
                    .toList();
            needs.add(new CoverNeed(e.className(), e.periodId(), period.label(), period.startTime(), period.endTime(),
                    e.subject(), e.room(), e.teacherId(), e.teacherName(),
                    subs.get(Substitution.idFor(date, e.className(), e.periodId())), free));
        }
        needs.sort(Comparator.comparing(CoverNeed::startTime).thenComparing(CoverNeed::className));
        return needs;
    }

    public Substitution assign(User user, SubstitutionRequest request) {
        TimetableEntry entry = store.timetable.findById(
                        TimetableEntry.idFor(request.className(), request.date().getDayOfWeek(), request.periodId()))
                .orElseThrow(() -> ApiErrors.badRequest("Class " + request.className() + " has no lesson in that period"));
        Teacher substitute = store.teachers.getById(request.substituteTeacherId());
        if (substitute.id().equals(entry.teacherId())) {
            throw ApiErrors.badRequest("That is the class's own teacher");
        }
        if (awayTeachers(request.date()).contains(substitute.id())) {
            throw ApiErrors.badRequest(substitute.name() + " is away that day");
        }
        boolean ownClass = store.timetable.where("e.day = ?1 and e.periodId = ?2 and e.teacherId = ?3",
                request.date().getDayOfWeek(), request.periodId(), substitute.id()).stream().findAny().isPresent();
        String subId = Substitution.idFor(request.date(), request.className(), request.periodId());
        boolean covering = store.substitutions.where("e.date = ?1 and e.periodId = ?2 and e.substituteTeacherId = ?3",
                request.date(), request.periodId(), substitute.id()).stream().anyMatch(s -> !s.id().equals(subId));
        if (ownClass || covering) {
            throw ApiErrors.conflict(substitute.name() + " is teaching another class in that period");
        }
        Substitution saved = store.substitutions.save(new Substitution(request.date(), request.className(),
                request.periodId(), entry.subject(), entry.room(), entry.teacherId(), entry.teacherName(),
                substitute.id(), substitute.name(), user.getName()));
        String period = store.periods.findById(request.periodId()).map(TimetablePeriod::label).orElse(request.periodId());
        notifications.notify(List.of(substitute.id()), "Substitution on " + request.date(),
                period + ": " + entry.subject() + ", class " + request.className()
                        + (entry.room() == null ? "" : ", room " + entry.room()) + " (for " + entry.teacherName() + ")",
                NotificationService.NOTICE, "/timetable");
        return saved;
    }

    public void removeSubstitution(String id) {
        store.substitutions.getById(id);
        store.substitutions.deleteById(id);
    }

    public List<Substitution> substitutions(LocalDate date) {
        return store.substitutions.where("e.date = ?1 order by e.className", date);
    }

    /** A teacher's periods for a date, including covers, minus periods someone else covers for them. */
    public List<TeacherPeriod> teacherDay(User user, String teacherId, LocalDate date) {
        String id = teacherId != null ? teacherId : user.getProfileId();
        if (user.getRole() != Role.ADMIN && !user.actorId().equals(id)) {
            throw ApiErrors.forbidden();
        }
        store.teachers.getById(id);
        if (calendar.holidayOn(date).isPresent()) {
            return List.of();
        }
        Map<String, TimetablePeriod> periods = timetable.periods().stream()
                .collect(Collectors.toMap(TimetablePeriod::id, Function.identity()));
        Set<String> coveredByOthers = store.substitutions.where("e.date = ?1 and e.originalTeacherId = ?2", date, id)
                .stream().map(Substitution::id).collect(Collectors.toSet());
        List<TeacherPeriod> result = new ArrayList<>();
        for (TimetableEntry e : store.timetable.where("e.day = ?1 and e.teacherId = ?2", date.getDayOfWeek(), id)) {
            TimetablePeriod p = periods.get(e.periodId());
            if (p == null || coveredByOthers.contains(Substitution.idFor(date, e.className(), e.periodId()))) continue;
            result.add(new TeacherPeriod(p.id(), p.label(), p.startTime(), p.endTime(), e.className(), e.subject(),
                    e.room(), false, null));
        }
        for (Substitution s : store.substitutions.where("e.date = ?1 and e.substituteTeacherId = ?2", date, id)) {
            TimetablePeriod p = periods.get(s.periodId());
            if (p == null) continue;
            TimetableEntry original = store.timetable.findById(
                    TimetableEntry.idFor(s.className(), date.getDayOfWeek(), s.periodId())).orElse(null);
            result.add(new TeacherPeriod(p.id(), p.label(), p.startTime(), p.endTime(), s.className(),
                    original == null ? null : original.subject(), original == null ? null : original.room(), true,
                    original == null ? null : original.teacherName()));
        }
        result.sort(Comparator.comparing(TeacherPeriod::startTime));
        return result;
    }

    private LocalTime now() {
        return LocalTime.now(clock).withSecond(0).withNano(0);
    }
}
