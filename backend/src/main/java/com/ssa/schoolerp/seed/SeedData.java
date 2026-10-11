package com.ssa.schoolerp.seed;

import com.ssa.schoolerp.model.AttendanceRecord;
import com.ssa.schoolerp.model.CalendarEvent;
import com.ssa.schoolerp.model.LeaveRequest;
import com.ssa.schoolerp.model.StaffAttendance;
import com.ssa.schoolerp.model.AttendanceStatus;
import com.ssa.schoolerp.model.Audience;
import com.ssa.schoolerp.model.Concession;
import com.ssa.schoolerp.model.DiscountType;
import com.ssa.schoolerp.model.Exam;
import com.ssa.schoolerp.model.ExamSchedule;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.FeeHead;
import com.ssa.schoolerp.model.FeePayment;
import com.ssa.schoolerp.model.Guardian;
import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.MarksRecord;
import com.ssa.schoolerp.model.Message;
import com.ssa.schoolerp.model.Notice;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.Question;
import com.ssa.schoolerp.model.RecipientType;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.SchoolSettings;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.StudyMaterial;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.TimetableEntry;
import com.ssa.schoolerp.model.TimetablePeriod;
import com.ssa.schoolerp.model.UserAccount;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.ssa.schoolerp.repository.DataStore;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.ssa.schoolerp.model.ReferenceData.ACADEMIC_YEAR;
import static com.ssa.schoolerp.model.ReferenceData.PAYMENT_MODES;

/**
 * Temporary demo data for the in-memory prototype, using the same people and classes as the frontend
 * mock data. Dates are relative to "today" so attendance, exams and homework always look current.
 * Variation (absences, marks, payments) comes from a hash of the ids, so every start gives the same data.
 */
public final class SeedData {

    public static final String DEMO_TEACHER_ID = "TCH-2026-001";
    public static final String DEMO_STUDENT_ID = "STU-2026-0503";
    public static final String DEMO_PARENT_ID = "PRN-2026-001";
    public static final String ADMIN_ID = "admin-001";

    private static final String[] BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "O+", "O-"};

    /** Class -> class teacher id. */
    private static final Map<String, String> CLASS_TEACHERS = Map.of(
            "1-A", "TCH-2026-003", "1-B", "TCH-2026-008", "5-B", "TCH-2026-001", "6-A", "TCH-2026-005",
            "8-A", "TCH-2026-002", "8-B", "TCH-2026-006", "10-A", "TCH-2026-007", "10-B", "TCH-2026-004");

    /** id, name, class, gender, guardian. Roll numbers follow the order within each class. */
    private static final String[][] STUDENTS = {
            {"STU-2026-0501", "Marium Chauhan", "5-B", "Female", "Imran Chauhan"},
            {"STU-2026-0502", "Kabir Jain", "5-B", "Male", "Rakesh Jain"},
            {"STU-2026-0503", "Rohit Verma", "5-B", "Male", "Sanjay Verma"},
            {"STU-2026-0504", "Rohit Ahmad", "5-B", "Male", "Naseem Ahmad"},
            {"STU-2026-0505", "Sneha Sharma", "5-B", "Female", "Vivek Sharma"},
            {"STU-2026-0506", "Saif Abbasi", "5-B", "Male", "Irfan Abbasi"},
            {"STU-2026-0507", "Alina Khan", "5-B", "Female", "Shahid Khan"},
            {"STU-2026-0508", "Devansh Roy", "5-B", "Male", "Amit Roy"},
            {"STU-2026-0512", "Ananya Verma", "5-B", "Female", "Rajesh Verma"},
            {"STU-2026-0601", "Owais Khan", "6-A", "Male", "Arman Khan"},
            {"STU-2026-0602", "Sara Khan", "6-A", "Female", "Faisal Khan"},
            {"STU-2026-0603", "Aarav Mehta", "6-A", "Male", "Nitin Mehta"},
            {"STU-2026-0604", "Ananya Gupta", "6-A", "Female", "Pankaj Gupta"},
            {"STU-2026-0605", "Rahul Singh", "6-A", "Male", "Vikram Singh"},
            {"STU-2026-0606", "Zoya Siddiqui", "6-A", "Female", "Asif Siddiqui"},
            {"STU-2026-0607", "Tanya Joshi", "6-A", "Female", "Hemant Joshi"},
            {"STU-2026-0608", "Yash Vardhan", "6-A", "Male", "Harsh Vardhan"},
            {"STU-2026-0001", "Ayesha Abbasi", "1-A", "Female", "Salim Abbasi"},
            {"STU-2026-0002", "Anas Kashyap", "1-A", "Male", "Deepak Kashyap"},
            {"STU-2026-0003", "Kabir Malik", "1-A", "Male", "Tariq Malik"},
            {"STU-2026-0004", "Kavya Sharma", "1-A", "Female", "Rohit Sharma"},
            {"STU-2026-0005", "Aditi Sharma", "1-B", "Female", "Nikhil Sharma"},
            {"STU-2026-0006", "Iqra Saifi", "1-B", "Female", "Javed Saifi"},
            {"STU-2026-0007", "Sanya Farooqui", "1-B", "Female", "Adil Farooqui"},
            {"STU-2026-0008", "Rohan Malhotra", "2-A", "Male", "Karan Malhotra"},
            {"STU-2026-0009", "Simran Kaur", "2-A", "Female", "Gurpreet Singh"},
            {"STU-2026-0010", "Vihaan Verma", "2-B", "Male", "Alok Verma"},
            {"STU-2026-0011", "Priya Joshi", "2-B", "Female", "Mahesh Joshi"},
            {"STU-2026-0012", "Rahul Kumar", "7-A", "Male", "Sunil Kumar"},
            {"STU-2026-0013", "Tanya Roy", "7-B", "Female", "Arup Roy"},
            {"STU-2026-0014", "Mohit Singh", "8-A", "Male", "Ajay Singh"},
            {"STU-2026-0824", "Yash Verma", "8-A", "Male", "Rajesh Verma"},
            {"STU-2026-0015", "Zoya Khan", "8-B", "Female", "Nadeem Khan"},
    };

    /** Has very poor attendance so the low-attendance reports have someone to show. */
    private static final String CHRONIC_ABSENTEE_ID = "STU-2026-0012";

    private SeedData() {
    }

    public static void populate(DataStore store, LocalDate today) {
        seedTeachers(store);
        seedClasses(store);
        seedStudents(store);
        seedParents(store);
        seedAttendance(store, today);
        seedExams(store, today);
        seedFees(store, today);
        seedNotices(store, today);
        seedHomework(store, today);
        seedStudyMaterials(store, today);
        seedMessages(store, today);
        seedTimetable(store);
        seedOperations(store, today);
        CampusSeed.populate(store, today);
        seedSettings(store);
        seedAccounts(store);
    }

    /** School details for certificates and report cards; the admin fills in the official numbers. */
    public static void seedSettings(DataStore s) {
        s.settings.save(new SchoolSettings("SSA Shiv Shanti Adarsh Academy", "Civil Lines, Meerut, Uttar Pradesh",
                null, null, "CBSE", null, null, null, ACADEMIC_YEAR));
    }

    /**
     * Demo logins: the four documented accounts, plus one for every other teacher, student and parent
     * (login = their email or ID; password teacher123 / student123 / parent123). Also used once to create
     * accounts for a database that was filled before accounts existed.
     */
    public static void seedAccounts(DataStore s) {
        account(s, ADMIN_ID, "admin@ssa.edu", DemoPasswords.ADMIN, Role.ADMIN, null, "School Administrator");
        account(s, "teacher-001", "teacher@ssa.edu", DemoPasswords.TEACHER, Role.TEACHER, DEMO_TEACHER_ID,
                s.teachers.findById(DEMO_TEACHER_ID).map(Teacher::name).orElse("Demo Teacher"));
        account(s, "student-001", "student@ssa.edu", DemoPasswords.STUDENT, Role.STUDENT, DEMO_STUDENT_ID,
                s.students.findById(DEMO_STUDENT_ID).map(Student::name).orElse("Demo Student"));
        account(s, "parent-001", "parent@ssa.edu", DemoPasswords.PARENT, Role.PARENT, DEMO_PARENT_ID,
                s.parents.findById(DEMO_PARENT_ID).map(Parent::name).orElse("Demo Parent"));

        s.teachers.stream().filter(t -> !t.id().equals(DEMO_TEACHER_ID)).forEach(t ->
                account(s, "ACC-" + t.id(), t.email(), DemoPasswords.TEACHER, Role.TEACHER, t.id(), t.name()));
        s.students.stream().filter(st -> !st.id().equals(DEMO_STUDENT_ID)).forEach(st ->
                account(s, "ACC-" + st.id(), st.email() != null ? st.email() : st.id().toLowerCase(Locale.ROOT),
                        DemoPasswords.STUDENT, Role.STUDENT, st.id(), st.name()));
        s.parents.stream().filter(p -> !p.id().equals(DEMO_PARENT_ID)).forEach(p ->
                account(s, "ACC-" + p.id(), p.email() != null ? p.email() : p.id().toLowerCase(Locale.ROOT),
                        DemoPasswords.PARENT, Role.PARENT, p.id(), p.name()));
    }

    private static void account(DataStore s, String id, String loginId, String passwordHash, Role role, String profileId,
                                String name) {
        s.accounts.save(new UserAccount(id, loginId.toLowerCase(Locale.ROOT), passwordHash, role, profileId, name, true,
                false, 0, null, null));
    }

    /** BCrypt is slow on purpose, so the four demo password hashes are computed once and reused. */
    private static final class DemoPasswords {
        private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();
        static final String ADMIN = ENCODER.encode("admin123");
        static final String TEACHER = ENCODER.encode("teacher123");
        static final String STUDENT = ENCODER.encode("student123");
        static final String PARENT = ENCODER.encode("parent123");
    }

    /** A stable pseudo-random number in 0..99 derived from the keys. */
    static int bucket(Object... keys) {
        int h = Arrays.stream(keys).map(String::valueOf).collect(Collectors.joining("|")).hashCode();
        h ^= h >>> 16;
        h *= 0x45d9f3b;
        h ^= h >>> 16;
        return Math.floorMod(h, 100);
    }

    // ---------------------------------------------------------------- people and classes

    /** Upcoming holidays/events, staff attendance for the last two weeks, and leave applications. */
    private static void seedOperations(DataStore s, LocalDate today) {
        s.calendar.save(new CalendarEvent("CAL-001", "Diwali break", nextWeekday(today.plusDays(22)),
                nextWeekday(today.plusDays(22)).plusDays(2), CalendarEvent.HOLIDAY, "School closed for Diwali."));
        s.calendar.save(new CalendarEvent("CAL-002", "Annual Sports Day", nextWeekday(today.plusDays(30)), null,
                CalendarEvent.EVENT, "Parents are welcome from 9 AM on the main ground."));
        s.calendar.save(new CalendarEvent("CAL-003", "Founders' Day", nextWeekday(today.plusDays(35)), null,
                CalendarEvent.HOLIDAY, null));

        List<Teacher> teachers = s.teachers.findAll();
        for (int back = 14; back >= 1; back--) {
            LocalDate day = today.minusDays(back);
            if (day.getDayOfWeek() == DayOfWeek.SUNDAY) continue;
            for (Teacher t : teachers) {
                boolean absent = t.id().equals("TCH-2026-006") && back == 3;
                s.staffAttendance.save(new StaffAttendance(t.id(), t.name(), day,
                        absent ? StaffAttendance.ABSENT : StaffAttendance.PRESENT,
                        absent ? null : LocalTime.of(7, 40 + (back + t.id().hashCode() & 15)),
                        absent ? null : LocalTime.of(14, 30), "Office"));
            }
        }

        // Tabassum Bano is on approved leave today (so the substitution screen has periods to cover).
        java.time.LocalDateTime applied = today.minusDays(2).atTime(9, 0);
        s.leaves.save(new LeaveRequest("LV-001", LeaveRequest.STAFF, "TCH-2026-005", "Tabassum Bano", null, today, today,
                "Family function", LeaveRequest.APPROVED, "TCH-2026-005", "Tabassum Bano", applied, "Principal",
                applied.plusHours(3), "Approved"));
        if (today.getDayOfWeek() != DayOfWeek.SUNDAY) {
            s.staffAttendance.save(new StaffAttendance("TCH-2026-005", "Tabassum Bano", today, StaffAttendance.LEAVE,
                    null, null, "Approved leave"));
        }
        s.leaves.save(new LeaveRequest("LV-002", LeaveRequest.STUDENT, "STU-2026-0512", "Ananya Verma", "5-B",
                today.plusDays(3), today.plusDays(4), "Cousin's wedding in Jaipur", LeaveRequest.PENDING,
                "PRN-2026-001", "Rajesh Verma", today.minusDays(1).atTime(19, 30), null, null, null));
        s.leaves.save(new LeaveRequest("LV-003", LeaveRequest.STAFF, "TCH-2026-001", "Anjali Singh", null,
                today.plusDays(6), today.plusDays(6), "Medical appointment", LeaveRequest.PENDING, "TCH-2026-001",
                "Anjali Singh", today.atTime(8, 0), null, null, null));
    }

    private static LocalDate nextWeekday(LocalDate day) {
        return day.getDayOfWeek() == DayOfWeek.SUNDAY ? day.plusDays(1) : day;
    }

    private static void seedTeachers(DataStore s) {
        teacher(s, "TCH-2026-001", "Anjali Singh", "M.Sc Mathematics, B.Ed", 8, LocalDate.of(2018, 6, 15),
                List.of("Mathematics", "Science"), List.of("5-B", "6-A"));
        teacher(s, "TCH-2026-002", "Javed Akhtar", "M.Sc Environmental Science, B.Ed", 11, LocalDate.of(2015, 7, 1),
                List.of("Environmental Studies"), List.of("1-A", "1-B", "8-A"));
        teacher(s, "TCH-2026-003", "Rehana Begum", "BFA, B.Ed", 6, LocalDate.of(2020, 4, 10),
                List.of("Art & Craft"), List.of("1-A", "1-B", "2-A", "2-B"));
        teacher(s, "TCH-2026-004", "Sunil Rathore", "MCA, B.Ed", 9, LocalDate.of(2017, 7, 1),
                List.of("Computer Science"), List.of("7-A", "7-B", "10-A", "10-B"));
        teacher(s, "TCH-2026-005", "Tabassum Bano", "M.A Hindi, B.Ed", 12, LocalDate.of(2014, 4, 1),
                List.of("Hindi"), List.of("5-A", "5-B", "6-A"));
        teacher(s, "TCH-2026-006", "Manoj Saini", "M.A History, B.Ed", 7, LocalDate.of(2019, 6, 20),
                List.of("Social Science"), List.of("8-A", "8-B", "9-B"));
        teacher(s, "TCH-2026-007", "Aisha Siddiqui", "M.A English, B.Ed", 10, LocalDate.of(2016, 7, 15),
                List.of("English"), List.of("7-A", "9-A", "10-A"));
        teacher(s, "TCH-2026-008", "Neha Gupta", "B.A English, B.Ed", 4, LocalDate.of(2022, 4, 1),
                List.of("English"), List.of("1-A", "1-B", "2-A", "2-B", "7-B"));
    }

    private static void teacher(DataStore s, String id, String name, String qualification, int years,
                                LocalDate joined, List<String> subjects, List<String> classes) {
        String email = name.toLowerCase(Locale.ROOT).replace(' ', '.') + "@ssa.edu";
        String phone = String.format("+91 98765 4%04d", bucket(id) * 97);
        s.teachers.save(new Teacher(id, name, email, phone, qualification, years + " years", joined, subjects,
                classes));
    }

    private static void seedClasses(DataStore s) {
        for (int grade = 1; grade <= 10; grade++) {
            for (String section : List.of("A", "B")) {
                String id = SchoolClass.idFor(grade, section);
                String room = "Room " + (grade * 100 + ("A".equals(section) ? 1 : 2));
                s.classes.save(new SchoolClass(id, grade, section, CLASS_TEACHERS.get(id), room, ACADEMIC_YEAR));
            }
        }
    }

    private static void seedStudents(DataStore s) {
        Map<String, Integer> nextRoll = new java.util.HashMap<>();
        for (String[] row : STUDENTS) {
            String id = row[0];
            String name = row[1];
            String className = row[2];
            int grade = Integer.parseInt(className.substring(0, className.indexOf('-')));
            int b = bucket(id);
            int roll = nextRoll.merge(className, 1, Integer::sum);
            String guardianEmail = row[4].toLowerCase(Locale.ROOT).replace(' ', '.') + "@example.com";
            Guardian guardian = new Guardian(row[4], "Father", String.format("+91 98%03d %05d", b * 7, b * 911),
                    guardianEmail);
            s.students.save(new Student(
                    id, name, className, roll, row[3],
                    LocalDate.of(2020 - grade, 1 + b % 12, 1 + b % 28),
                    BLOOD_GROUPS[b % BLOOD_GROUPS.length],
                    name.toLowerCase(Locale.ROOT).replace(' ', '.') + "@student.ssa.edu",
                    (10 + b) + ", Civil Lines, Meerut, U.P. - 250001",
                    LocalDate.of(2027 - grade, 4, 1),
                    guardian));
        }
    }

    private static void seedParents(DataStore s) {
        s.parents.save(new Parent(DEMO_PARENT_ID, "Rajesh Verma", "rajesh.verma@example.com", "+91 98765 12345",
                "Father", List.of("STU-2026-0824", "STU-2026-0512")));
    }

    // ---------------------------------------------------------------- attendance

    private static void seedAttendance(DataStore s, LocalDate today) {
        // Two classes are left unmarked today so the dashboards show a "not marked yet" state.
        Set<String> unmarkedToday = Set.of("7-B", "8-B");
        for (LocalDate date = today.minusDays(30); !date.isAfter(today); date = date.plusDays(1)) {
            if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }
            for (Student student : s.students.findAll()) {
                if (date.equals(today) && unmarkedToday.contains(student.className())) {
                    continue;
                }
                int b = bucket(student.id(), date);
                boolean chronic = student.id().equals(CHRONIC_ABSENTEE_ID);
                AttendanceStatus status;
                if (b < (chronic ? 35 : 4)) {
                    status = AttendanceStatus.ABSENT;
                } else if (b < (chronic ? 40 : 9)) {
                    status = AttendanceStatus.LATE;
                } else if (b < (chronic ? 42 : 11)) {
                    status = AttendanceStatus.LEAVE;
                } else {
                    status = AttendanceStatus.PRESENT;
                }
                String checkIn = switch (status) {
                    case PRESENT -> String.format("07:%02d AM", 40 + b % 20);
                    case LATE -> String.format("08:%02d AM", 15 + b % 30);
                    default -> null;
                };
                String remarks = switch (status) {
                    case LATE -> "Arrived late";
                    case LEAVE -> "Approved leave";
                    default -> null;
                };
                s.attendance.save(new AttendanceRecord(AttendanceRecord.idFor(student.id(), date), student.id(),
                        student.className(), date, status, checkIn, remarks, classTeacherName(s, student.className())));
            }
        }
    }

    private static String classTeacherName(DataStore s, String className) {
        return s.teachers.findById(CLASS_TEACHERS.get(className)).map(Teacher::name).orElse("School Office");
    }

    // ---------------------------------------------------------------- exams and marks

    private static void seedExams(DataStore s, LocalDate today) {
        s.exams.save(new Exam("EXM-2026-UT1", "Unit Test 1", "Unit Test", ACADEMIC_YEAR,
                today.minusDays(25), today.minusDays(18),
                List.of("1-A", "1-B", "2-A", "2-B", "5-B", "6-A", "7-A", "7-B", "8-A", "8-B"),
                "First periodic assessment for primary and middle classes.", null, Exam.RESULTS_PUBLISHED));
        s.exams.save(new Exam("EXM-2026-PT2", "Class Assessment Test 2", "Periodic Test", ACADEMIC_YEAR,
                today.minusDays(12), today.minusDays(5), List.of("5-B", "6-A"),
                "Monthly evaluation for Mathematics, Science and Hindi.", null, Exam.RESULTS_DRAFT));
        s.exams.save(new Exam("EXM-2026-MID", "Mid-Term Examination 2026", "Mid-Term", ACADEMIC_YEAR,
                today.plusDays(3), today.plusDays(15),
                List.of("5-B", "6-A", "7-A", "7-B", "8-A", "8-B", "9-A", "9-B", "10-A", "10-B"),
                "Comprehensive mid-term evaluation across core subjects.", null, Exam.RESULTS_DRAFT));

        paper(s, "SCH-001", "EXM-2026-UT1", "Mathematics", "5-B", today.minusDays(24), 25, 9);
        paper(s, "SCH-002", "EXM-2026-UT1", "Science", "6-A", today.minusDays(23), 25, 9);
        paper(s, "SCH-003", "EXM-2026-UT1", "Hindi", "5-B", today.minusDays(22), 25, 9);
        paper(s, "SCH-004", "EXM-2026-UT1", "Environmental Studies", "1-A", today.minusDays(21), 25, 9);
        paper(s, "SCH-005", "EXM-2026-UT1", "Environmental Studies", "1-B", today.minusDays(21), 25, 9);
        paper(s, "SCH-006", "EXM-2026-UT1", "English", "7-A", today.minusDays(20), 25, 9);
        paper(s, "SCH-007", "EXM-2026-UT1", "Social Science", "8-A", today.minusDays(19), 25, 9);
        paper(s, "SCH-008", "EXM-2026-PT2", "Mathematics", "5-B", today.minusDays(11), 50, 18);
        paper(s, "SCH-009", "EXM-2026-PT2", "Science", "6-A", today.minusDays(10), 50, 18);
        paper(s, "SCH-010", "EXM-2026-PT2", "Hindi", "6-A", today.minusDays(8), 50, 18);
        paper(s, "SCH-011", "EXM-2026-MID", "Mathematics", "5-B", today.plusDays(3), 100, 33);
        paper(s, "SCH-012", "EXM-2026-MID", "Science", "6-A", today.plusDays(4), 100, 33);
        paper(s, "SCH-013", "EXM-2026-MID", "English", "10-A", today.plusDays(5), 100, 33);
        paper(s, "SCH-014", "EXM-2026-MID", "Computer Science", "10-B", today.plusDays(6), 100, 33);
        paper(s, "SCH-015", "EXM-2026-MID", "Social Science", "8-B", today.plusDays(7), 100, 33);

        // Class 5-B's papers are marked question by question, so students see the breakdown (Q1 3/5, Q2 5/5, ...).
        for (String scheduleId : List.of("SCH-001", "SCH-003", "SCH-008")) {
            ExamSchedule paper = s.schedules.getById(scheduleId);
            int each = paper.maxMarks() / 5;
            s.schedules.save(paper.withQuestions(List.of(new Question("Q1", each), new Question("Q2", each),
                    new Question("Q3", each), new Question("Q4", each), new Question("Q5", paper.maxMarks() - 4 * each))));
        }

        // Unit Test 1 is fully marked; Test 2 is partly marked so marks entry has work left to do.
        for (String scheduleId : List.of("SCH-001", "SCH-002", "SCH-003", "SCH-004", "SCH-005", "SCH-006", "SCH-007")) {
            marks(s, scheduleId, Integer.MAX_VALUE, MarksRecord.SUBMITTED);
        }
        marks(s, "SCH-008", 7, MarksRecord.SUBMITTED);
        marks(s, "SCH-009", 5, MarksRecord.DRAFT);
    }

    private static void paper(DataStore s, String id, String examId, String subject, String className,
                              LocalDate date, int maxMarks, int passingMarks) {
        String endTime = maxMarks >= 100 ? "12:00 PM" : "10:30 AM";
        s.schedules.save(new ExamSchedule(id, examId, subject, className, date, "09:00 AM", endTime, maxMarks,
                passingMarks, null));
    }

    /**
     * Splits a total over the paper's questions so it adds up exactly: each question gets about the same share of
     * its maximum, nudged per student so the breakdown is not uniform. Null when the paper has no questions.
     */
    private static List<Double> splitByQuestion(List<Question> questions, double total, int seed) {
        if (questions.isEmpty()) return null;
        double max = questions.stream().mapToDouble(Question::maxMarks).sum();
        double[] marks = new double[questions.size()];
        double given = 0;
        for (int i = 0; i < marks.length; i++) {
            double nudge = ((seed + i * 37) % 5 - 2) * 0.1; // -0.2 .. +0.2
            double share = Math.max(0, Math.min(1, total / max + nudge));
            marks[i] = Math.min(questions.get(i).maxMarks(), Math.round(questions.get(i).maxMarks() * share));
            given += marks[i];
        }
        // Move the difference onto questions that still have room (or marks to give back).
        for (int i = 0; given != total && i < marks.length * 50; i++) {
            int q = i % marks.length;
            if (given < total && marks[q] < questions.get(q).maxMarks()) {
                marks[q]++;
                given++;
            } else if (given > total && marks[q] > 0) {
                marks[q]--;
                given--;
            }
        }
        return java.util.Arrays.stream(marks).boxed().toList();
    }

    private static void marks(DataStore s, String scheduleId, int studentLimit, String status) {
        ExamSchedule paper = s.schedules.getById(scheduleId);
        String teacherName = s.teachers.stream()
                .filter(t -> t.teaches(paper.className(), paper.subject()))
                .map(Teacher::name)
                .findFirst()
                .orElse("School Admin");
        s.students.stream()
                .filter(st -> st.className().equals(paper.className()))
                .sorted(Comparator.comparing(Student::rollNumber))
                .limit(studentLimit)
                .forEach(st -> {
                    int b = bucket(st.id(), scheduleId);
                    boolean absent = b < 3;
                    Double obtained = absent ? null : (double) Math.round(paper.maxMarks() * (0.3 + 0.7 * b / 99.0));
                    s.marks.save(new MarksRecord(MarksRecord.idFor(scheduleId, st.id()), paper.examId(), scheduleId,
                            paper.className(), paper.subject(), st.id(), st.name(), st.rollNumber(), paper.maxMarks(),
                            obtained, absent, status, teacherName)
                            .withQuestionMarks(absent ? null : splitByQuestion(paper.questions(), obtained, b)));
                });
    }

    // ---------------------------------------------------------------- fees

    private static void seedFees(DataStore s, LocalDate today) {
        List<String> allClasses = s.classes.stream().map(SchoolClass::id).toList();
        List<FeeHead> heads = List.of(
                new FeeHead("FH-ADM", "Admission & Development Fee (2026-27)", 3200, "One-Time",
                        LocalDate.of(2026, 3, 31), ACADEMIC_YEAR, allClasses),
                new FeeHead("FH-Q1", "Tuition Fee — Quarter 1 (2026-27)", 4500, "Quarterly",
                        LocalDate.of(2026, 4, 20), ACADEMIC_YEAR, allClasses),
                new FeeHead("FH-Q2", "Tuition Fee — Quarter 2 (2026-27)", 4500, "Quarterly",
                        LocalDate.of(2026, 7, 20), ACADEMIC_YEAR, allClasses),
                new FeeHead("FH-EXM", "Examination Fee — Half Yearly", 800, "One-Time",
                        LocalDate.of(2026, 9, 30), ACADEMIC_YEAR, allClasses),
                new FeeHead("FH-Q3", "Tuition Fee — Quarter 3 (2026-27)", 4500, "Quarterly",
                        LocalDate.of(2026, 10, 20), ACADEMIC_YEAR, allClasses));
        heads.forEach(s.feeHeads::save);

        int receipt = 0;
        for (Student student : s.students.findAll()) {
            for (FeeHead head : heads) {
                int b = bucket(student.id(), head.id());
                long paid = switch (head.id()) {
                    case "FH-ADM" -> head.amount();
                    case "FH-Q1" -> b < 92 ? head.amount() : b < 96 ? 2000 : 0;
                    case "FH-Q2" -> b < 75 ? head.amount() : b < 88 ? 2500 : 0;
                    case "FH-EXM" -> b < 55 ? head.amount() : 0;
                    default -> b < 20 ? head.amount() : 0; // not due yet; a few families pay early
                };
                FeeDue due = new FeeDue(FeeDue.idFor(student.id(), head.id()), student.id(), head.id(), head.title(),
                        head.amount(), 0, paid, head.dueDate());
                s.feeDues.save(due);
                if (paid == 0) {
                    continue;
                }
                LocalDate paidOn = "FH-Q3".equals(head.id())
                        ? today.minusDays(b % 4)
                        : head.dueDate().minusDays(b % 10);
                if (paidOn.isAfter(today)) {
                    paidOn = today;
                }
                receipt++;
                s.payments.save(new FeePayment(String.format("PAY-%05d", receipt),
                        String.format("RCP-2026-%05d", receipt), student.id(), student.name(), student.className(),
                        due.id(), head.title(), paid, PAYMENT_MODES.get(b % PAYMENT_MODES.size()),
                        paidOn.atTime(LocalTime.of(9 + b % 6, (b * 7) % 60)), "Paid at fee counter", "School Admin"));
            }
        }

        concession(s, "STU-2026-0502", "FH-Q3", "Merit", 25, "Merit scholarship for 2026-27.", today.minusDays(20));
        concession(s, "STU-2026-0512", "FH-Q3", "Sibling", 10, "Sibling concession (brother Yash Verma, 8-A).",
                today.minusDays(20));
    }

    private static void concession(DataStore s, String studentId, String feeHeadId, String type, int percent,
                                   String description, LocalDate approvedOn) {
        FeeDue due = s.feeDues.getById(FeeDue.idFor(studentId, feeHeadId));
        long discount = Math.min(due.pending(), Math.round(due.amount() * percent / 100.0));
        if (discount == 0) {
            return;
        }
        s.feeDues.save(due.withConcession(due.concession() + discount));
        s.concessions.save(new Concession("CON-" + studentId + "-" + feeHeadId, studentId, due.id(), due.title(),
                type, DiscountType.PERCENTAGE, percent, discount, description, "School Admin", approvedOn));
    }

    // ---------------------------------------------------------------- communication and content

    private static void seedNotices(DataStore s, LocalDate today) {
        notice(s, "NTC-001", "Mid-Term Examination Datesheet Released",
                "The datesheet for the Mid-Term Examination is now available. Exams begin on "
                        + today.plusDays(3) + ". Admit cards can be collected from the class teacher.",
                "high", Audience.ALL, ADMIN_ID, "School Admin", today.minusDays(2));
        notice(s, "NTC-002", "Quarter 3 Fee Payment Reminder",
                "Tuition fee for Quarter 3 is due on 20 October. A late fee applies to payments after the due date.",
                "high", Audience.PARENTS, ADMIN_ID, "School Admin", today.minusDays(4));
        notice(s, "NTC-003", "Parent–Teacher Meeting",
                "A Parent–Teacher Meeting for all classes will be held from 9:00 AM to 1:00 PM in the classrooms. "
                        + "Please collect the Unit Test 1 progress report.",
                "medium", Audience.PARENTS, ADMIN_ID, "School Admin", today.minusDays(8));
        notice(s, "NTC-004", "Change in School Timings",
                "School timings will be 8:00 AM to 1:30 PM until further notice. Transport timings have been "
                        + "adjusted accordingly.",
                "medium", Audience.ALL, ADMIN_ID, "School Admin", today.minusDays(15));
        notice(s, "NTC-005", "Staff Meeting on Exam Duties",
                "All teachers are requested to attend a short meeting in the staff room after school to finalise "
                        + "invigilation duties.",
                "low", Audience.STAFF, ADMIN_ID, "School Admin", today.minusDays(1));
        notice(s, "NTC-006", "Maths Olympiad Registrations Open",
                "Students of classes 5 and 6 interested in the inter-school Maths Olympiad can register with "
                        + "Anjali Ma'am by Friday.",
                "low", Audience.STUDENTS, DEMO_TEACHER_ID, "Anjali Singh", today.minusDays(3));
    }

    private static void notice(DataStore s, String id, String title, String description, String priority,
                               Audience audience, String authorId, String authorName, LocalDate date) {
        s.notices.save(new Notice(id, title, description, priority, audience, authorId, authorName, date, date));
    }

    private static void seedHomework(DataStore s, LocalDate today) {
        s.homework.save(new Homework("HW-001", "Fractions & Decimals Practice",
                "Complete Exercise 4.2 from Chapter 4, problems 1 to 15.", "Mathematics", "5-B",
                today.minusDays(3), today.plusDays(2), "Show all calculation steps clearly.",
                List.of("Fractions_Practice_Sheet.pdf"), "TCH-2026-001", "Anjali Singh"));
        s.homework.save(new Homework("HW-002", "Plant Cell Structure Diagram",
                "Draw a labelled plant cell and describe the chloroplast, cell wall and nucleus.", "Science", "6-A",
                today.minusDays(2), today.plusDays(3), "Use coloured pencils for the organelles.",
                List.of("Plant_Cell_Guide.pdf"), "TCH-2026-001", "Anjali Singh"));
        s.homework.save(new Homework("HW-003", "Kavita Recitation",
                "Learn the poem 'Pushp ki Abhilasha' for recitation in class.", "Hindi", "5-B",
                today.minusDays(6), today.minusDays(1), null, List.of(), "TCH-2026-005", "Tabassum Bano"));
        s.homework.save(new Homework("HW-004", "Map Work: Rivers of India",
                "Mark the major rivers of India and their tributaries on the outline map.", "Social Science", "8-A",
                today.minusDays(1), today.plusDays(4), null, List.of("India_Outline_Map.pdf"), "TCH-2026-006",
                "Manoj Saini"));
        s.homework.save(new Homework("HW-005", "Water Cycle Poster",
                "Make a poster showing the water cycle.", "Environmental Studies", "1-A",
                today.minusDays(2), today.plusDays(5), null, List.of(), "TCH-2026-002", "Javed Akhtar"));
    }

    private static void seedStudyMaterials(DataStore s, LocalDate today) {
        material(s, "MAT-001", "Chapter 4 — Fractions & Decimals Notes", "Mathematics", "5-B", "Notes",
                today.minusDays(20), "PDF", "2.4 MB", "TCH-2026-001", "Anjali Singh");
        material(s, "MAT-002", "Cell Organelles & Functions Study Guide", "Science", "6-A", "Notes",
                today.minusDays(18), "PDF", "3.1 MB", "TCH-2026-001", "Anjali Singh");
        material(s, "MAT-003", "Fractions Worksheet Set B", "Mathematics", "5-B", "Worksheet",
                today.minusDays(9), "PDF", "0.8 MB", "TCH-2026-001", "Anjali Singh");
        material(s, "MAT-004", "Mid-Term Revision Checklist", "Science", "6-A", "Revision",
                today.minusDays(1), "DOCX", "0.3 MB", "TCH-2026-001", "Anjali Singh");
        material(s, "MAT-005", "Hindi Vyakaran Reference", "Hindi", "5-B", "Reference",
                today.minusDays(14), "PDF", "1.6 MB", "TCH-2026-005", "Tabassum Bano");
    }

    private static void material(DataStore s, String id, String title, String subject, String className,
                                 String category, LocalDate uploaded, String fileType, String fileSize,
                                 String teacherId, String teacherName) {
        s.studyMaterials.save(new StudyMaterial(id, title, subject, className, category, uploaded, fileType, fileSize,
                teacherId, teacherName));
    }

    private static void seedMessages(DataStore s, LocalDate today) {
        s.messages.save(new Message("MSG-001", DEMO_TEACHER_ID, "Anjali Singh", Role.TEACHER, RecipientType.CLASS,
                "5-B", null, "Class 5-B Parents", "Math Class Test on Tuesday",
                "Dear parents, a periodic test on Chapter 4 Fractions will be held on Tuesday in period 1. "
                        + "Please make sure students bring their geometry boxes.",
                today.minusDays(4).atTime(10, 30)));
        s.messages.save(new Message("MSG-002", DEMO_TEACHER_ID, "Anjali Singh", Role.TEACHER, RecipientType.STUDENT,
                "6-A", "STU-2026-0601", "Owais Khan (Parent: Arman Khan)", "Science Lab Journal Submission",
                "Dear Mr. Khan, Owais has done an excellent job on his light reflection lab journal. "
                        + "Keep up the high standard!",
                today.minusDays(5).atTime(14, 15)));
        s.messages.save(new Message("MSG-003", DEMO_TEACHER_ID, "Anjali Singh", Role.TEACHER, RecipientType.CLASS,
                "6-A", null, "Class 6-A Parents", "Science Exhibition Project Materials",
                "Groups for the science exhibition have been finalised and topic guidelines are in Study Materials.",
                today.minusDays(7).atTime(16, 0)));
        s.messages.save(new Message("MSG-004", DEMO_PARENT_ID, "Rajesh Verma", Role.PARENT, RecipientType.TEACHER,
                "5-B", "TCH-2026-001", "Anjali Singh", "Ananya's absence on Friday",
                "Ma'am, Ananya will be absent on Friday for a family function. Please share any class work she misses.",
                today.minusDays(1).atTime(8, 10)));
        s.messages.save(new Message("MSG-005", DEMO_TEACHER_ID, "Anjali Singh", Role.TEACHER, RecipientType.STUDENT,
                "5-B", "STU-2026-0512", "Ananya Verma (Parent: Rajesh Verma)", "Re: Ananya's absence on Friday",
                "Noted, Mr. Verma. The worksheet for Friday is in Study Materials.",
                today.minusDays(1).atTime(12, 40)));
    }

    // ---------------------------------------------------------------- timetable

    private static void seedTimetable(DataStore s) {
        List.of(
                new TimetablePeriod("period-1", "Period 1", LocalTime.of(8, 0), LocalTime.of(8, 45), "period"),
                new TimetablePeriod("period-2", "Period 2", LocalTime.of(8, 45), LocalTime.of(9, 30), "period"),
                new TimetablePeriod("period-3", "Period 3", LocalTime.of(9, 30), LocalTime.of(10, 15), "period"),
                new TimetablePeriod("break-1", "Short Break", LocalTime.of(10, 15), LocalTime.of(10, 30), "break"),
                new TimetablePeriod("period-4", "Period 4", LocalTime.of(10, 30), LocalTime.of(11, 15), "period"),
                new TimetablePeriod("period-5", "Period 5", LocalTime.of(11, 15), LocalTime.of(12, 0), "period"),
                new TimetablePeriod("lunch-1", "Lunch Break", LocalTime.of(12, 0), LocalTime.of(12, 40), "break"),
                new TimetablePeriod("period-6", "Period 6", LocalTime.of(12, 40), LocalTime.of(13, 25), "period"),
                new TimetablePeriod("period-7", "Period 7", LocalTime.of(13, 25), LocalTime.of(14, 10), "period"),
                new TimetablePeriod("period-8", "Period 8", LocalTime.of(14, 10), LocalTime.of(14, 55), "period"))
                .forEach(s.periods::save);

        slot(s, "1-A", DayOfWeek.MONDAY, "period-1", "Environmental Studies", "TCH-2026-002");
        slot(s, "1-A", DayOfWeek.MONDAY, "period-2", "Art & Craft", "TCH-2026-003");
        slot(s, "1-A", DayOfWeek.MONDAY, "period-3", "English", "TCH-2026-008");

        slot(s, "5-B", DayOfWeek.MONDAY, "period-1", "Mathematics", "TCH-2026-001");
        slot(s, "5-B", DayOfWeek.MONDAY, "period-2", "Hindi", "TCH-2026-005");
        slot(s, "6-A", DayOfWeek.MONDAY, "period-2", "Science", "TCH-2026-001");
        slot(s, "5-B", DayOfWeek.MONDAY, "period-4", "Mathematics", "TCH-2026-001");
        slot(s, "5-B", DayOfWeek.TUESDAY, "period-1", "Mathematics", "TCH-2026-001");
        slot(s, "5-B", DayOfWeek.TUESDAY, "period-2", "Hindi", "TCH-2026-005");
        slot(s, "6-A", DayOfWeek.TUESDAY, "period-3", "Science", "TCH-2026-001");
        slot(s, "6-A", DayOfWeek.TUESDAY, "period-6", "Science", "TCH-2026-001");
        slot(s, "6-A", DayOfWeek.WEDNESDAY, "period-1", "Hindi", "TCH-2026-005");
        slot(s, "5-B", DayOfWeek.WEDNESDAY, "period-2", "Mathematics", "TCH-2026-001");
        slot(s, "6-A", DayOfWeek.WEDNESDAY, "period-4", "Science", "TCH-2026-001");
        slot(s, "5-B", DayOfWeek.THURSDAY, "period-1", "Mathematics", "TCH-2026-001");
        slot(s, "6-A", DayOfWeek.THURSDAY, "period-2", "Science", "TCH-2026-001");
        slot(s, "5-B", DayOfWeek.THURSDAY, "period-5", "Mathematics", "TCH-2026-001");
        slot(s, "5-B", DayOfWeek.FRIDAY, "period-3", "Mathematics", "TCH-2026-001");
        slot(s, "6-A", DayOfWeek.FRIDAY, "period-5", "Science", "TCH-2026-001");
        slot(s, "5-B", DayOfWeek.SATURDAY, "period-1", "Mathematics", "TCH-2026-001");
        slot(s, "6-A", DayOfWeek.SATURDAY, "period-2", "Science", "TCH-2026-001");
    }

    private static void slot(DataStore s, String className, DayOfWeek day, String periodId, String subject,
                             String teacherId) {
        Teacher teacher = s.teachers.getById(teacherId);
        String room = s.classes.getById(className).room();
        s.timetable.save(new TimetableEntry(TimetableEntry.idFor(className, day, periodId), className, day, periodId,
                subject, teacherId, teacher.name(), room));
    }
}
