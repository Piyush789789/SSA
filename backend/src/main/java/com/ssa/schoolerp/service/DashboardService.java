package com.ssa.schoolerp.service;

import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.TimetableEntry;
import com.ssa.schoolerp.model.TimetablePeriod;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Role-specific dashboards, computed from the live data rather than hard-coded figures. */
@Service
public class DashboardService {

    private final DataStore store;
    private final AccessGuard guard;
    private final AttendanceService attendance;
    private final ExamService exams;
    private final FeeService fees;
    private final NoticeService notices;
    private final Clock clock;

    public DashboardService(DataStore store, AccessGuard guard, AttendanceService attendance, ExamService exams,
                            FeeService fees, NoticeService notices, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.attendance = attendance;
        this.exams = exams;
        this.fees = fees;
        this.notices = notices;
        this.clock = clock;
    }

    public Map<String, Object> forUser(User user) {
        return switch (user.getRole()) {
            case ADMIN -> admin(user);
            case TEACHER -> teacher(user);
            case STUDENT -> studentOverview(user, guard.studentOf(user));
            case PARENT -> parent(user);
        };
    }

    public Map<String, Object> admin(User user) {
        LocalDate today = LocalDate.now(clock);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("date", today);
        data.put("totalStudents", store.students.count());
        data.put("totalTeachers", store.teachers.count());
        data.put("totalClasses", store.classes.count());
        data.put("todayAttendance", attendance.schoolSummary(today));
        data.put("fees", fees.overview(null));
        data.put("upcomingExams", exams.upcomingPapers(s -> true, 5));
        data.put("lowAttendance", attendance.lowAttendance(store.students.findAll()));
        data.put("recentNotices", notices.visibleTo(user).stream().limit(5).toList());
        return data;
    }

    private Map<String, Object> teacher(User user) {
        LocalDate today = LocalDate.now(clock);
        Teacher teacher = guard.teacherOf(user);
        List<Student> students = teacher.assignedClasses().stream()
                .flatMap(c -> store.studentsOf(c).stream())
                .toList();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("date", today);
        data.put("teacher", teacher);
        data.put("classes", teacher.assignedClasses().stream().map(c -> attendance.daySummary(c, today)).toList());
        data.put("todaysTimetable", timetableFor(teacher.id(), today));
        data.put("upcomingExams", exams.upcomingPapers(s -> teacher.teaches(s.className(), s.subject()), 5));
        data.put("pendingMarksEntry", exams.pendingMarksEntry(teacher));
        data.put("homeworkDue", store.homework.stream()
                .filter(h -> teacher.id().equals(h.teacherId()) && !h.dueDate().isBefore(today))
                .sorted(Comparator.comparing(Homework::dueDate))
                .toList());
        data.put("lowAttendance", attendance.lowAttendance(students));
        data.put("recentNotices", notices.visibleTo(user).stream().limit(5).toList());
        return data;
    }

    private Map<String, Object> parent(User user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("date", LocalDate.now(clock));
        data.put("parent", guard.parentOf(user));
        data.put("children", guard.childrenOf(user).stream().map(child -> studentOverview(user, child)).toList());
        return data;
    }

    private Map<String, Object> studentOverview(User user, Student student) {
        LocalDate today = LocalDate.now(clock);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("date", today);
        data.put("student", student);
        data.put("attendance", attendance.statsForStudent(user, student.id(), null, null));
        data.put("fees", fees.studentSummary(user, student.id()));
        data.put("upcomingExams", exams.upcomingPapers(s -> s.className().equals(student.className()), 5));
        List<?> results = exams.studentResult(user, student.id(), null).subjects();
        data.put("recentResults", results.subList(Math.max(0, results.size() - 5), results.size()));
        data.put("homeworkDue", store.homework.stream()
                .filter(h -> h.className().equals(student.className()) && !h.dueDate().isBefore(today))
                .sorted(Comparator.comparing(Homework::dueDate))
                .toList());
        data.put("recentNotices", notices.visibleTo(user).stream().limit(5).toList());
        return data;
    }

    private List<TimetableEntry> timetableFor(String teacherId, LocalDate date) {
        Map<String, LocalTime> starts = store.periods.stream()
                .collect(Collectors.toMap(TimetablePeriod::id, TimetablePeriod::startTime));
        return store.timetable.stream()
                .filter(e -> e.teacherId().equals(teacherId) && e.day() == date.getDayOfWeek())
                .sorted(Comparator.comparing(e -> starts.getOrDefault(e.periodId(), LocalTime.MAX)))
                .toList();
    }
}
