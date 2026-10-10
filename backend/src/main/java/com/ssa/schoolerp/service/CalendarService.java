package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.OperationsDtos.HolidayCheck;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.CalendarEvent;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/** The school calendar: holidays (no attendance, no fee reminders) and events. Sundays are always off. */
@Service
@Transactional
public class CalendarService {

    private final DataStore store;
    private final Clock clock;
    private final NotificationService notifications;

    public CalendarService(DataStore store, Clock clock, NotificationService notifications) {
        this.store = store;
        this.clock = clock;
        this.notifications = notifications;
    }

    /** Entries overlapping the range (both ends optional), in date order. */
    public List<CalendarEvent> list(LocalDate from, LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.of(1900, 1, 1);
        LocalDate end = to != null ? to : LocalDate.of(9999, 12, 31);
        return store.calendar.where("e.startDate <= ?1 and coalesce(e.endDate, e.startDate) >= ?2 order by e.startDate",
                end, start);
    }

    public CalendarEvent create(CalendarEvent request) {
        CalendarEvent event = store.calendar.save(normalized(store.nextId("CAL"), request));
        announce(event);
        return event;
    }

    public CalendarEvent update(String id, CalendarEvent request) {
        store.calendar.getById(id);
        return store.calendar.save(normalized(id, request));
    }

    public void delete(String id) {
        store.calendar.getById(id);
        store.calendar.deleteById(id);
    }

    /** The holiday covering that date, if any (Sundays count as holidays). */
    public Optional<String> holidayOn(LocalDate date) {
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return Optional.of("Sunday");
        }
        return store.calendar.where("e.type = ?1 and e.startDate <= ?2 and coalesce(e.endDate, e.startDate) >= ?2",
                        CalendarEvent.HOLIDAY, date).stream()
                .map(CalendarEvent::title)
                .findFirst();
    }

    public HolidayCheck check(LocalDate date) {
        Optional<String> holiday = holidayOn(date);
        return new HolidayCheck(date, holiday.isPresent(), holiday.orElse(null));
    }

    /** School days in the range: not Sundays, not holidays. */
    public List<LocalDate> schoolDays(LocalDate from, LocalDate to) {
        Set<LocalDate> holidays = new HashSet<>();
        for (CalendarEvent e : list(from, to)) {
            if (e.isHoliday()) {
                e.startDate().datesUntil(e.lastDate().plusDays(1)).forEach(holidays::add);
            }
        }
        return from.datesUntil(to.plusDays(1))
                .filter(d -> d.getDayOfWeek() != DayOfWeek.SUNDAY && !holidays.contains(d))
                .toList();
    }

    private static CalendarEvent normalized(String id, CalendarEvent request) {
        LocalDate end = request.endDate();
        if (end != null && end.isBefore(request.startDate())) {
            throw ApiErrors.badRequest("The end date is before the start date");
        }
        if (end != null && end.equals(request.startDate())) {
            end = null;
        }
        String type = request.type() == null ? CalendarEvent.HOLIDAY : request.type();
        return new CalendarEvent(id, request.title().trim(), request.startDate(), end, type, request.description());
    }

    /** Tells everyone about upcoming holidays and events (not about past ones being entered for the record). */
    private void announce(CalendarEvent event) {
        if (event.lastDate().isBefore(LocalDate.now(clock))) {
            return;
        }
        String when = event.endDate() == null ? event.startDate().toString()
                : event.startDate() + " to " + event.endDate();
        String title = (event.isHoliday() ? "Holiday: " : "Event: ") + event.title();
        notifications.notifyRoles(List.of(Role.STUDENT, Role.PARENT, Role.TEACHER), title, when,
                NotificationService.NOTICE, "/calendar");
    }
}
