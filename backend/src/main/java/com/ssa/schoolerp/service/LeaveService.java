package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.OperationsDtos.LeaveApplication;
import com.ssa.schoolerp.dto.OperationsDtos.LeaveDecision;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.AttendanceRecord;
import com.ssa.schoolerp.model.AttendanceStatus;
import com.ssa.schoolerp.model.LeaveRequest;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.StaffAttendance;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Leave applications. Students (or their parents) apply to the class teachers; teachers apply to the admins.
 * Approving marks the school days in the range as leave, unless the person was already marked present.
 */
@Service
@Transactional
public class LeaveService {

    private static final int MAX_DAYS = 60;
    private static final int MAX_DAYS_BACK = 30;

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;
    private final CalendarService calendar;
    private final NotificationService notifications;

    public LeaveService(DataStore store, AccessGuard guard, Clock clock, CalendarService calendar,
                        NotificationService notifications) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.calendar = calendar;
        this.notifications = notifications;
    }

    public LeaveRequest apply(User user, LeaveApplication application) {
        LocalDate today = LocalDate.now(clock);
        if (application.toDate().isBefore(application.fromDate())) {
            throw ApiErrors.badRequest("The leave ends before it starts");
        }
        if (ChronoUnit.DAYS.between(application.fromDate(), application.toDate()) >= MAX_DAYS) {
            throw ApiErrors.badRequest("A leave application can cover at most " + MAX_DAYS + " days");
        }
        if (application.fromDate().isBefore(today.minusDays(MAX_DAYS_BACK))) {
            throw ApiErrors.badRequest("Leave can be applied at most " + MAX_DAYS_BACK + " days after it was taken");
        }
        LeaveRequest leave = switch (user.getRole()) {
            case STUDENT, PARENT -> {
                String studentId = user.getRole() == Role.STUDENT ? user.getProfileId() : application.studentId();
                if (studentId == null) {
                    throw ApiErrors.badRequest("Choose the child the leave is for");
                }
                Student student = guard.checkStudentAccess(user, studentId);
                yield newLeave(LeaveRequest.STUDENT, student.id(), student.name(), student.className(), application,
                        user);
            }
            case TEACHER -> {
                Teacher teacher = guard.teacherOf(user);
                yield newLeave(LeaveRequest.STAFF, teacher.id(), teacher.name(), null, application, user);
            }
            case ADMIN -> throw ApiErrors.badRequest("Admins record staff leave from the staff attendance sheet");
        };
        boolean overlaps = store.leaves.where("e.personId = ?1 and e.status <> ?2 and e.fromDate <= ?3 and e.toDate >= ?4",
                leave.personId(), LeaveRequest.REJECTED, leave.toDate(), leave.fromDate()).stream().findAny().isPresent();
        if (overlaps) {
            throw ApiErrors.conflict("There is already a leave application for some of these days");
        }
        store.leaves.save(leave);

        String body = leave.personName() + ": " + range(leave) + " — " + leave.reason();
        if (LeaveRequest.STUDENT.equals(leave.applicantType())) {
            notifications.notify(teachersOf(leave.className()), "Leave application", body,
                    NotificationService.ATTENDANCE, "/leaves");
        } else {
            notifications.notifyAdmins("Staff leave application", body, NotificationService.ATTENDANCE, "/leaves");
        }
        return leave;
    }

    /**
     * Admins see everything; teachers their own leave and their classes' students'; students their own; parents
     * their children's. Newest first.
     */
    public List<LeaveRequest> list(User user, String status, String type) {
        StringBuilder where = new StringBuilder("1 = 1");
        List<Object> params = new java.util.ArrayList<>();
        switch (user.getRole()) {
            case ADMIN -> {
                // everything
            }
            case TEACHER -> {
                params.add(user.getProfileId());
                params.add(guard.readableClasses(user));
                where.append(" and (e.personId = ?1 or (e.applicantType = 'STUDENT' and e.className in ?2))");
            }
            case STUDENT, PARENT -> {
                params.add(guard.readableStudentIds(user));
                where.append(" and e.personId in ?1");
            }
        }
        if (status != null && !status.isBlank()) {
            params.add(status.trim().toUpperCase());
            where.append(" and e.status = ?").append(params.size());
        }
        if (type != null && !type.isBlank()) {
            params.add(type.trim().toUpperCase());
            where.append(" and e.applicantType = ?").append(params.size());
        }
        return store.leaves.whereLimited(500, where + " order by e.appliedAt desc", params.toArray());
    }

    public LeaveRequest decide(User user, String id, LeaveDecision decision) {
        LeaveRequest leave = store.leaves.getById(id);
        checkCanDecide(user, leave);
        if (!LeaveRequest.PENDING.equals(leave.status())) {
            throw ApiErrors.conflict("This leave application was already " + leave.status().toLowerCase());
        }
        String newStatus = decision.approve() ? LeaveRequest.APPROVED : LeaveRequest.REJECTED;
        LeaveRequest decided = store.leaves.save(leave.decided(newStatus, user.getName(), LocalDateTime.now(clock),
                decision.note()));
        if (decision.approve()) {
            markLeave(decided, user.getName());
        }

        String title = "Leave " + newStatus.toLowerCase();
        String body = range(decided) + (decision.note() == null || decision.note().isBlank() ? "" : " — " + decision.note());
        if (LeaveRequest.STUDENT.equals(decided.applicantType())) {
            store.students.findById(decided.personId()).ifPresent(s ->
                    notifications.notifyFamily(s, title, s.name() + ": " + body, NotificationService.ATTENDANCE,
                            "/leaves", false));
        } else {
            notifications.notify(List.of(decided.personId()), title, body, NotificationService.ATTENDANCE, "/leaves");
        }
        return decided;
    }

    /** The applicant withdraws a pending application. */
    public void cancel(User user, String id) {
        LeaveRequest leave = store.leaves.getById(id);
        boolean own = user.getId().equals(leave.appliedById()) || user.actorId().equals(leave.appliedById())
                || user.getRole() == Role.ADMIN;
        if (!own) {
            throw ApiErrors.forbidden();
        }
        if (!LeaveRequest.PENDING.equals(leave.status())) {
            throw ApiErrors.conflict("Only a pending application can be withdrawn");
        }
        store.leaves.deleteById(id);
    }

    /** The approved leave covering this person on that date, if any. */
    public Optional<LeaveRequest> approvedLeaveOn(String personId, LocalDate date) {
        return store.leaves.where("e.personId = ?1 and e.status = ?2 and e.fromDate <= ?3 and e.toDate >= ?3",
                personId, LeaveRequest.APPROVED, date).stream().findFirst();
    }

    /** Ids of staff on approved leave that day. */
    public Set<String> staffOnLeave(LocalDate date) {
        return Set.copyOf(store.leaves.where("e.applicantType = ?1 and e.status = ?2 and e.fromDate <= ?3 and e.toDate >= ?3",
                LeaveRequest.STAFF, LeaveRequest.APPROVED, date).stream().map(LeaveRequest::personId).toList());
    }

    private void checkCanDecide(User user, LeaveRequest leave) {
        boolean allowed = switch (user.getRole()) {
            case ADMIN -> !leave.personId().equals(user.getProfileId());
            case TEACHER -> LeaveRequest.STUDENT.equals(leave.applicantType())
                    && guard.teacherOf(user).assignedClasses().contains(leave.className());
            case STUDENT, PARENT -> false;
        };
        if (!allowed) {
            throw ApiErrors.forbidden();
        }
    }

    /** Leave on each school day of the range, except days the person was already marked present or late. */
    private void markLeave(LeaveRequest leave, String markedBy) {
        for (LocalDate day : calendar.schoolDays(leave.fromDate(), leave.toDate())) {
            if (LeaveRequest.STUDENT.equals(leave.applicantType())) {
                String recordId = AttendanceRecord.idFor(leave.personId(), day);
                boolean attended = store.attendance.findById(recordId)
                        .map(r -> r.status() == AttendanceStatus.PRESENT || r.status() == AttendanceStatus.LATE)
                        .orElse(false);
                if (!attended) {
                    store.attendance.save(new AttendanceRecord(recordId, leave.personId(), leave.className(), day,
                            AttendanceStatus.LEAVE, null, "Approved leave: " + leave.reason(), markedBy));
                }
            } else {
                String recordId = StaffAttendance.idFor(leave.personId(), day);
                boolean attended = store.staffAttendance.findById(recordId).map(r -> !r.away()).orElse(false);
                if (!attended) {
                    store.staffAttendance.save(new StaffAttendance(leave.personId(), leave.personName(), day,
                            StaffAttendance.LEAVE, null, null, markedBy));
                }
            }
        }
    }

    private List<String> teachersOf(String className) {
        return store.teachers.stream().filter(t -> t.assignedClasses().contains(className)).map(Teacher::id).toList();
    }

    private LeaveRequest newLeave(String type, String personId, String personName, String className,
                                  LeaveApplication application, User user) {
        return new LeaveRequest(store.nextId("LV"), type, personId, personName, className, application.fromDate(),
                application.toDate(), application.reason().trim(), LeaveRequest.PENDING, user.actorId(), user.getName(),
                LocalDateTime.now(clock), null, null, null);
    }

    private static String range(LeaveRequest leave) {
        return leave.fromDate().equals(leave.toDate()) ? leave.fromDate().toString()
                : leave.fromDate() + " to " + leave.toDate();
    }
}
