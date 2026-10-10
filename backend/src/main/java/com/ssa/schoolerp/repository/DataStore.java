package com.ssa.schoolerp.repository;

import com.ssa.schoolerp.model.AttendanceRecord;
import com.ssa.schoolerp.model.Concession;
import com.ssa.schoolerp.model.Exam;
import com.ssa.schoolerp.model.ExamSchedule;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.FeeHead;
import com.ssa.schoolerp.model.FeePayment;
import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.MarksRecord;
import com.ssa.schoolerp.model.Message;
import com.ssa.schoolerp.model.Notice;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.StudyMaterial;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.TimetableEntry;
import com.ssa.schoolerp.model.TimetablePeriod;
import com.ssa.schoolerp.seed.SeedData;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/** All application data, held in memory and seeded with demo data on startup. */
@Component
public class DataStore {

    public final InMemoryRepository<SchoolClass> classes = new InMemoryRepository<>("Class");
    public final InMemoryRepository<Student> students = new InMemoryRepository<>("Student");
    public final InMemoryRepository<Teacher> teachers = new InMemoryRepository<>("Teacher");
    public final InMemoryRepository<Parent> parents = new InMemoryRepository<>("Parent");
    public final InMemoryRepository<AttendanceRecord> attendance = new InMemoryRepository<>("Attendance record");
    public final InMemoryRepository<Exam> exams = new InMemoryRepository<>("Exam");
    public final InMemoryRepository<ExamSchedule> schedules = new InMemoryRepository<>("Exam schedule");
    public final InMemoryRepository<MarksRecord> marks = new InMemoryRepository<>("Marks record");
    public final InMemoryRepository<FeeHead> feeHeads = new InMemoryRepository<>("Fee head");
    public final InMemoryRepository<FeeDue> feeDues = new InMemoryRepository<>("Fee due");
    public final InMemoryRepository<FeePayment> payments = new InMemoryRepository<>("Payment");
    public final InMemoryRepository<Concession> concessions = new InMemoryRepository<>("Concession");
    public final InMemoryRepository<Notice> notices = new InMemoryRepository<>("Notice");
    public final InMemoryRepository<Homework> homework = new InMemoryRepository<>("Homework");
    public final InMemoryRepository<StudyMaterial> studyMaterials = new InMemoryRepository<>("Study material");
    public final InMemoryRepository<Message> messages = new InMemoryRepository<>("Message");
    public final InMemoryRepository<TimetablePeriod> periods = new InMemoryRepository<>("Period");
    public final InMemoryRepository<TimetableEntry> timetable = new InMemoryRepository<>("Timetable entry");

    private final AtomicLong sequence = new AtomicLong();
    private final Clock clock;

    public DataStore(Clock clock) {
        this.clock = clock;
        reset();
    }

    /** Wipes every collection and reloads the demo data set. */
    public final synchronized void reset() {
        List.of(classes, students, teachers, parents, attendance, exams, schedules, marks, feeHeads, feeDues,
                payments, concessions, notices, homework, studyMaterials, messages, periods, timetable)
                .forEach(InMemoryRepository::clear);
        sequence.set(1000);
        SeedData.populate(this, LocalDate.now(clock));
    }

    /** Id for a newly created record. Numbering starts above the seeded ids so the two never collide. */
    public String nextId(String prefix) {
        return prefix + "-" + sequence.incrementAndGet();
    }

    /** The students of a class, in roll-number order. */
    public List<Student> studentsOf(String className) {
        return students.stream()
                .filter(s -> s.className().equals(className))
                .sorted(Comparator.comparing(Student::rollNumber))
                .toList();
    }
}
