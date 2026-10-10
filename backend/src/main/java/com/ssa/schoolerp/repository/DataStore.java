package com.ssa.schoolerp.repository;

import com.ssa.schoolerp.model.AttendanceRecord;
import com.ssa.schoolerp.model.Concession;
import com.ssa.schoolerp.model.Exam;
import com.ssa.schoolerp.model.ExamSchedule;
import com.ssa.schoolerp.model.FeeDeposit;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.FeeHead;
import com.ssa.schoolerp.model.FeePayment;
import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.IdCounter;
import com.ssa.schoolerp.model.Identifiable;
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
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/** All application tables. Seeds the demo data the first time it starts against an empty database. */
@Component
public class DataStore {

    private static final Logger log = LoggerFactory.getLogger(DataStore.class);

    /** Generated ids start above the seeded ones so the two never collide. */
    private static final long FIRST_GENERATED_ID = 1000;

    public final TableRepository<SchoolClass> classes;
    public final TableRepository<Student> students;
    public final TableRepository<Teacher> teachers;
    public final TableRepository<Parent> parents;
    public final TableRepository<AttendanceRecord> attendance;
    public final TableRepository<Exam> exams;
    public final TableRepository<ExamSchedule> schedules;
    public final TableRepository<MarksRecord> marks;
    public final TableRepository<FeeHead> feeHeads;
    public final TableRepository<FeeDue> feeDues;
    public final TableRepository<FeePayment> payments;
    public final TableRepository<Concession> concessions;
    public final TableRepository<FeeDeposit> deposits;
    public final TableRepository<Notice> notices;
    public final TableRepository<Homework> homework;
    public final TableRepository<StudyMaterial> studyMaterials;
    public final TableRepository<Message> messages;
    public final TableRepository<TimetablePeriod> periods;
    public final TableRepository<TimetableEntry> timetable;
    private final TableRepository<IdCounter> idCounters;

    private final EntityManager em;
    private final TransactionTemplate tx;
    private final TransactionTemplate independentTx;
    private final Clock clock;

    public DataStore(EntityManager em, PlatformTransactionManager transactionManager, Clock clock) {
        this.em = em;
        this.clock = clock;
        this.tx = new TransactionTemplate(transactionManager);
        this.independentTx = new TransactionTemplate(transactionManager);
        this.independentTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        classes = table(SchoolClass.class, "Class");
        students = table(Student.class, "Student");
        teachers = table(Teacher.class, "Teacher");
        parents = table(Parent.class, "Parent");
        attendance = table(AttendanceRecord.class, "Attendance record");
        exams = table(Exam.class, "Exam");
        schedules = table(ExamSchedule.class, "Exam schedule");
        marks = table(MarksRecord.class, "Marks record");
        feeHeads = table(FeeHead.class, "Fee head");
        feeDues = table(FeeDue.class, "Fee due");
        payments = table(FeePayment.class, "Payment");
        concessions = table(Concession.class, "Concession");
        deposits = table(FeeDeposit.class, "Fee deposit");
        notices = table(Notice.class, "Notice");
        homework = table(Homework.class, "Homework");
        studyMaterials = table(StudyMaterial.class, "Study material");
        messages = table(Message.class, "Message");
        periods = table(TimetablePeriod.class, "Period");
        timetable = table(TimetableEntry.class, "Timetable entry");
        idCounters = table(IdCounter.class, "Id counter");
    }

    private <T extends Identifiable> TableRepository<T> table(Class<T> type, String name) {
        return new TableRepository<>(type, name, em, tx);
    }

    @PostConstruct
    void seedIfEmpty() {
        if (classes.count() == 0) {
            log.info("Empty database: loading demo data");
            reset();
        }
    }

    /** Wipes every table and reloads the demo data set. */
    public synchronized void reset() {
        tx.executeWithoutResult(status -> {
            List.of(classes, students, teachers, parents, attendance, exams, schedules, marks, feeHeads, feeDues,
                    payments, concessions, deposits, notices, homework, studyMaterials, messages, periods, timetable,
                    idCounters).forEach(TableRepository::clear);
            em.flush();
            SeedData.populate(this, LocalDate.now(clock));
        });
    }

    /**
     * Id for a newly created record, e.g. "HW-1001". The counter lives in the database (so ids stay unique
     * across restarts) and is committed in its own transaction, so concurrent requests never share a number.
     */
    public synchronized String nextId(String prefix) {
        long value = independentTx.execute(status -> {
            IdCounter counter = em.find(IdCounter.class, "global", LockModeType.PESSIMISTIC_WRITE);
            if (counter == null) {
                counter = new IdCounter("global", FIRST_GENERATED_ID);
                em.persist(counter);
            }
            return counter.next();
        });
        return prefix + "-" + value;
    }

    /** The students of a class, in roll-number order. */
    public List<Student> studentsOf(String className) {
        return students.stream()
                .filter(s -> s.className().equals(className))
                .sorted(Comparator.comparing(Student::rollNumber))
                .toList();
    }
}
