package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.ScheduleSlot;
import com.ssa.schoolerp.dto.TimetableEntryRequest;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.TimetableEntry;
import com.ssa.schoolerp.model.TimetablePeriod;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@Transactional
public class TimetableService {

    private final DataStore store;
    private final AccessGuard guard;

    public TimetableService(DataStore store, AccessGuard guard) {
        this.store = store;
        this.guard = guard;
    }

    public List<TimetablePeriod> periods() {
        return store.periods.stream().sorted(Comparator.comparing(TimetablePeriod::startTime)).toList();
    }

    /** The full school day for a class: every period in order, with breaks and free periods. Empty on Sundays. */
    public List<ScheduleSlot> daySchedule(String className, DayOfWeek day) {
        if (day == DayOfWeek.SUNDAY) {
            return List.of();
        }
        Map<String, TimetableEntry> entries = store.timetable.stream()
                .filter(e -> e.className().equals(className) && e.day() == day)
                .collect(Collectors.toMap(TimetableEntry::periodId, e -> e, (a, b) -> a));
        return periods().stream()
                .map(p -> {
                    TimetableEntry e = entries.get(p.id());
                    return new ScheduleSlot(p.id(), p.label(), p.startTime(), p.endTime(), p.type(),
                            e == null ? null : e.subject(), e == null ? null : e.teacherName(),
                            e == null ? null : e.room());
                })
                .toList();
    }

    public List<ScheduleSlot> daySchedule(User user, String className, DayOfWeek day) {
        store.classes.getById(className);
        guard.checkClassAccess(user, className);
        return daySchedule(className, day);
    }

    /** Replaces the day's period structure. Entries in periods that no longer exist are removed. */
    public synchronized List<TimetablePeriod> replacePeriods(List<TimetablePeriod> periods) {
        List<TimetablePeriod> sorted = periods.stream().sorted(Comparator.comparing(TimetablePeriod::startTime)).toList();
        Set<String> ids = new HashSet<>();
        for (int i = 0; i < sorted.size(); i++) {
            TimetablePeriod period = sorted.get(i);
            if (!ids.add(period.id())) {
                throw ApiErrors.badRequest("Duplicate period id: " + period.id());
            }
            if (!period.endTime().isAfter(period.startTime())) {
                throw ApiErrors.badRequest(period.label() + " must end after it starts");
            }
            if (i > 0 && period.startTime().isBefore(sorted.get(i - 1).endTime())) {
                throw ApiErrors.badRequest(period.label() + " overlaps " + sorted.get(i - 1).label());
            }
        }
        store.periods.clear();
        sorted.forEach(store.periods::save);
        store.timetable.deleteWhere(e -> !ids.contains(e.periodId()));
        return sorted;
    }

    public List<TimetableEntry> forClass(User user, String className) {
        store.classes.getById(className);
        guard.checkClassAccess(user, className);
        return entries(e -> e.className().equals(className));
    }

    public List<TimetableEntry> forTeacher(User user, String teacherId) {
        store.teachers.getById(teacherId);
        if (user.getRole() != Role.ADMIN && !user.actorId().equals(teacherId)) {
            throw ApiErrors.forbidden();
        }
        return entries(e -> teacherId.equals(e.teacherId()));
    }

    /** Creates or replaces the entry for a class slot. A teacher cannot be in two classes at once. */
    public synchronized TimetableEntry saveEntry(TimetableEntryRequest request) {
        SchoolClass schoolClass = store.classes.getById(request.className());
        TimetablePeriod period = store.periods.getById(request.periodId());
        if (!"period".equals(period.type())) {
            throw ApiErrors.badRequest(period.label() + " is a break, not a teaching period");
        }
        Teacher teacher = store.teachers.getById(request.teacherId());
        if (!teacher.teaches(schoolClass.id(), request.subject())) {
            throw ApiErrors.badRequest(teacher.name() + " does not teach " + request.subject() + " to " + schoolClass.id());
        }
        String id = TimetableEntry.idFor(schoolClass.id(), request.day(), period.id());
        store.timetable.stream()
                .filter(e -> !e.id().equals(id) && teacher.id().equals(e.teacherId())
                        && e.day() == request.day() && e.periodId().equals(period.id()))
                .findFirst()
                .ifPresent(clash -> {
                    throw ApiErrors.conflict(teacher.name() + " already teaches " + clash.className() + " in "
                            + period.label() + " on " + request.day());
                });
        String room = request.room() != null ? request.room() : schoolClass.room();
        return store.timetable.save(new TimetableEntry(id, schoolClass.id(), request.day(), period.id(),
                request.subject(), teacher.id(), teacher.name(), room));
    }

    public void deleteEntry(String id) {
        store.timetable.getById(id);
        store.timetable.deleteById(id);
    }

    private List<TimetableEntry> entries(Predicate<TimetableEntry> filter) {
        Map<String, LocalTime> starts = store.periods.stream()
                .collect(Collectors.toMap(TimetablePeriod::id, TimetablePeriod::startTime));
        return store.timetable.stream()
                .filter(filter)
                .sorted(Comparator.comparing(TimetableEntry::day)
                        .thenComparing(e -> starts.getOrDefault(e.periodId(), LocalTime.MAX)))
                .toList();
    }
}
