package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.ExamDtos.ClassResultRow;
import com.ssa.schoolerp.dto.ExamDtos.MarksEntry;
import com.ssa.schoolerp.dto.ExamDtos.MarksProgress;
import com.ssa.schoolerp.dto.ExamDtos.MarksSaveRequest;
import com.ssa.schoolerp.dto.ExamDtos.MarksSheet;
import com.ssa.schoolerp.dto.ExamDtos.MarksSheetRow;
import com.ssa.schoolerp.dto.ExamDtos.PendingMarksEntry;
import com.ssa.schoolerp.dto.ExamDtos.StudentResult;
import com.ssa.schoolerp.dto.ExamDtos.SubjectResult;
import com.ssa.schoolerp.dto.ExamDtos.UpcomingPaper;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Exam;
import com.ssa.schoolerp.model.ExamSchedule;
import com.ssa.schoolerp.model.MarksRecord;
import com.ssa.schoolerp.model.ReferenceData;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExamService {

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;

    public ExamService(DataStore store, AccessGuard guard, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- exams

    /** Exams that include at least one class the user can see. */
    public List<Exam> listExams(User user) {
        Set<String> classes = guard.readableClasses(user);
        return store.exams.stream()
                .filter(exam -> exam.classes().stream().anyMatch(classes::contains))
                .map(this::withLiveStatus)
                .sorted(Comparator.comparing(Exam::startDate))
                .toList();
    }

    public Exam getExam(User user, String id) {
        Exam exam = store.exams.getById(id);
        Set<String> classes = guard.readableClasses(user);
        if (exam.classes().stream().noneMatch(classes::contains)) {
            throw ApiErrors.forbidden();
        }
        return withLiveStatus(exam);
    }

    public Exam createExam(Exam request) {
        validateExam(request);
        Exam exam = new Exam(store.nextId("EXM"), request.name(), request.type(), academicYearOr(request.academicYear()),
                request.startDate(), request.endDate(), List.copyOf(request.classes()), request.description(), null,
                Exam.RESULTS_DRAFT);
        return withLiveStatus(store.exams.save(exam));
    }

    public Exam updateExam(String id, Exam request) {
        Exam existing = store.exams.getById(id);
        validateExam(request);
        boolean papersOutside = store.schedules.stream()
                .filter(s -> s.examId().equals(id))
                .anyMatch(s -> !request.classes().contains(s.className())
                        || s.date().isBefore(request.startDate()) || s.date().isAfter(request.endDate()));
        if (papersOutside) {
            throw ApiErrors.conflict("Some papers of this exam fall outside the new classes or dates; update them first");
        }
        Exam exam = new Exam(id, request.name(), request.type(), academicYearOr(request.academicYear()),
                request.startDate(), request.endDate(), List.copyOf(request.classes()), request.description(), null,
                existing.resultsStatus());
        return withLiveStatus(store.exams.save(exam));
    }

    /** Deletes the exam together with its papers and marks. */
    public void deleteExam(String id) {
        store.exams.getById(id);
        store.marks.deleteWhere(m -> m.examId().equals(id));
        store.schedules.deleteWhere(s -> s.examId().equals(id));
        store.exams.deleteById(id);
    }

    public Exam setResultsPublished(String id, boolean published) {
        Exam exam = store.exams.getById(id);
        Exam updated = exam.withResultsStatus(published ? Exam.RESULTS_PUBLISHED : Exam.RESULTS_DRAFT);
        return withLiveStatus(store.exams.save(updated));
    }

    private void validateExam(Exam exam) {
        if (exam.endDate().isBefore(exam.startDate())) {
            throw ApiErrors.badRequest("End date must be on or after the start date");
        }
        if (!ReferenceData.EXAM_TYPES.contains(exam.type())) {
            throw ApiErrors.badRequest("Unknown exam type: " + exam.type());
        }
        exam.classes().forEach(store.classes::getById);
    }

    // ---------------------------------------------------------------- papers (exam schedules)

    public List<ExamSchedule> listSchedules(User user, String examId, String className) {
        if (examId != null) {
            store.exams.getById(examId);
        }
        if (className != null) {
            guard.checkClassAccess(user, className);
        }
        Set<String> classes = guard.readableClasses(user);
        return store.schedules.stream()
                .filter(s -> classes.contains(s.className()))
                .filter(s -> examId == null || s.examId().equals(examId))
                .filter(s -> className == null || s.className().equals(className))
                .map(this::withLiveStatus)
                .sorted(Comparator.comparing(ExamSchedule::date).thenComparing(ExamSchedule::className))
                .toList();
    }

    public ExamSchedule addSchedule(String examId, ExamSchedule request) {
        Exam exam = store.exams.getById(examId);
        validateSchedule(exam, request, null);
        ExamSchedule schedule = request.withIds(store.nextId("SCH"), examId).withStatus(null);
        return withLiveStatus(store.schedules.save(schedule));
    }

    public ExamSchedule updateSchedule(String id, ExamSchedule request) {
        ExamSchedule existing = store.schedules.getById(id);
        Exam exam = store.exams.getById(existing.examId());
        validateSchedule(exam, request, id);
        boolean marksTooHigh = store.marks.stream()
                .filter(m -> m.scheduleId().equals(id) && m.obtainedMarks() != null)
                .anyMatch(m -> m.obtainedMarks() > request.maxMarks());
        if (marksTooHigh) {
            throw ApiErrors.conflict("Some entered marks are above the new maximum of " + request.maxMarks());
        }
        if (!existing.className().equals(request.className()) || !existing.subject().equals(request.subject())) {
            if (store.marks.stream().anyMatch(m -> m.scheduleId().equals(id))) {
                throw ApiErrors.conflict("Marks have been entered for this paper; its class and subject cannot change");
            }
        }
        ExamSchedule schedule = request.withIds(id, existing.examId()).withStatus(null);
        store.schedules.save(schedule);
        // Keep the stored copy of maxMarks on each marks record in step with the paper.
        store.marks.findWhere(m -> m.scheduleId().equals(id)).forEach(m -> store.marks.save(new MarksRecord(
                m.id(), m.examId(), m.scheduleId(), m.className(), m.subject(), m.studentId(), m.studentName(),
                m.rollNumber(), request.maxMarks(), m.obtainedMarks(), m.absent(), m.status(), m.enteredBy())));
        return withLiveStatus(schedule);
    }

    public void deleteSchedule(String id) {
        store.schedules.getById(id);
        store.marks.deleteWhere(m -> m.scheduleId().equals(id));
        store.schedules.deleteById(id);
    }

    private void validateSchedule(Exam exam, ExamSchedule paper, String ownId) {
        if (!exam.classes().contains(paper.className())) {
            throw ApiErrors.badRequest("Class " + paper.className() + " is not part of " + exam.name());
        }
        if (!ReferenceData.SUBJECTS.contains(paper.subject())) {
            throw ApiErrors.badRequest("Unknown subject: " + paper.subject());
        }
        if (paper.date().isBefore(exam.startDate()) || paper.date().isAfter(exam.endDate())) {
            throw ApiErrors.badRequest("Paper date must fall between " + exam.startDate() + " and " + exam.endDate());
        }
        if (paper.passingMarks() > paper.maxMarks()) {
            throw ApiErrors.badRequest("Passing marks cannot exceed maximum marks");
        }
        boolean duplicate = store.schedules.stream()
                .anyMatch(s -> !s.id().equals(ownId) && s.examId().equals(exam.id())
                        && s.className().equals(paper.className()) && s.subject().equals(paper.subject()));
        if (duplicate) {
            throw ApiErrors.conflict(exam.name() + " already has a " + paper.subject() + " paper for " + paper.className());
        }
    }

    public List<UpcomingPaper> upcomingPapers(Predicate<ExamSchedule> filter, int limit) {
        LocalDate today = LocalDate.now(clock);
        Map<String, Exam> exams = examsById();
        return store.schedules.stream()
                .filter(s -> !s.date().isBefore(today))
                .filter(filter)
                .sorted(Comparator.comparing(ExamSchedule::date).thenComparing(ExamSchedule::className))
                .limit(limit)
                .map(s -> new UpcomingPaper(s.id(), s.examId(), exams.get(s.examId()).name(), s.subject(),
                        s.className(), s.date(), s.startTime(), s.endTime(), s.maxMarks()))
                .toList();
    }

    /** Papers the teacher has already sat that still have students without marks. */
    public List<PendingMarksEntry> pendingMarksEntry(Teacher teacher) {
        LocalDate today = LocalDate.now(clock);
        Map<String, Exam> exams = examsById();
        return store.schedules.stream()
                .filter(s -> teacher.teaches(s.className(), s.subject()) && !s.date().isAfter(today))
                .map(s -> new PendingMarksEntry(s.id(), exams.get(s.examId()).name(), s.subject(), s.className(),
                        s.date(), (int) store.marks.stream().filter(m -> m.scheduleId().equals(s.id())).count(),
                        store.studentsOf(s.className()).size()))
                .filter(p -> p.entered() < p.totalStudents())
                .sorted(Comparator.comparing(PendingMarksEntry::date))
                .toList();
    }

    // ---------------------------------------------------------------- marks

    /** Every student of the paper's class, with their marks if entered, so new papers can be filled in. */
    public MarksSheet marksSheet(User user, String scheduleId) {
        ExamSchedule paper = store.schedules.getById(scheduleId);
        guard.checkCanManageClass(user, paper.className());
        Map<String, MarksRecord> existing = store.marks.stream()
                .filter(m -> m.scheduleId().equals(scheduleId))
                .collect(Collectors.toMap(MarksRecord::studentId, Function.identity()));
        List<MarksSheetRow> rows = store.studentsOf(paper.className()).stream()
                .map(st -> {
                    MarksRecord m = existing.get(st.id());
                    return m == null
                            ? new MarksSheetRow(st.id(), st.name(), st.rollNumber(), null, false, "Not Entered")
                            : new MarksSheetRow(st.id(), st.name(), st.rollNumber(), m.obtainedMarks(), m.absent(), m.status());
                })
                .toList();
        return new MarksSheet(withLiveStatus(paper), store.exams.getById(paper.examId()).name(), rows);
    }

    public MarksSheet saveMarks(User user, String scheduleId, MarksSaveRequest request) {
        ExamSchedule paper = store.schedules.getById(scheduleId);
        Exam exam = store.exams.getById(paper.examId());
        if (user.getRole() == Role.TEACHER) {
            if (!guard.teacherOf(user).teaches(paper.className(), paper.subject())) {
                throw ApiErrors.forbidden();
            }
            if (exam.isPublished()) {
                throw ApiErrors.conflict("Results for this exam are published; ask an admin to unpublish them first");
            }
        } else {
            guard.checkCanManageClass(user, paper.className());
        }
        if (paper.date().isAfter(LocalDate.now(clock))) {
            throw ApiErrors.badRequest("Marks cannot be entered before the exam date (" + paper.date() + ")");
        }

        Map<String, Student> roster = store.studentsOf(paper.className()).stream()
                .collect(Collectors.toMap(Student::id, Function.identity()));
        String status = request.submit() ? MarksRecord.SUBMITTED : MarksRecord.DRAFT;
        Set<String> seen = new HashSet<>();
        List<MarksRecord> records = new ArrayList<>();
        List<String> cleared = new ArrayList<>();
        // Validate everything before saving anything, so a bad row cannot leave a half-saved sheet.
        for (MarksEntry entry : request.entries()) {
            Student student = roster.get(entry.studentId());
            if (student == null) {
                throw ApiErrors.badRequest("Student " + entry.studentId() + " is not in class " + paper.className());
            }
            if (!seen.add(student.id())) {
                throw ApiErrors.badRequest("Student " + student.id() + " appears more than once");
            }
            if (entry.clear()) {
                cleared.add(MarksRecord.idFor(scheduleId, student.id()));
                continue;
            }
            if (!entry.absent() && entry.obtainedMarks() == null) {
                continue; // left blank: not entered yet, not zero
            }
            if (!entry.absent() && entry.obtainedMarks() > paper.maxMarks()) {
                throw ApiErrors.badRequest("Marks for " + student.name() + " exceed the maximum of " + paper.maxMarks());
            }
            records.add(new MarksRecord(MarksRecord.idFor(scheduleId, student.id()), paper.examId(), scheduleId,
                    paper.className(), paper.subject(), student.id(), student.name(), student.rollNumber(),
                    paper.maxMarks(), entry.absent() ? null : entry.obtainedMarks(), entry.absent(), status,
                    user.getName()));
        }
        records.forEach(store.marks::save);
        cleared.forEach(store.marks::deleteById);
        return marksSheet(user, scheduleId);
    }

    /** Entered/submitted counts per paper, for the admin's "marks pending" view. */
    public List<MarksProgress> marksProgress(String examId) {
        if (examId != null) {
            store.exams.getById(examId);
        }
        Map<String, List<MarksRecord>> bySchedule = store.marks.stream()
                .collect(Collectors.groupingBy(MarksRecord::scheduleId));
        return store.schedules.stream()
                .filter(s -> examId == null || s.examId().equals(examId))
                .sorted(Comparator.comparing(ExamSchedule::date).thenComparing(ExamSchedule::className))
                .map(s -> {
                    List<MarksRecord> marks = bySchedule.getOrDefault(s.id(), List.of());
                    int submitted = (int) marks.stream().filter(m -> MarksRecord.SUBMITTED.equals(m.status())).count();
                    return new MarksProgress(s.id(), s.examId(), s.subject(), s.className(), s.date(), marks.size(),
                            submitted, store.studentsOf(s.className()).size());
                })
                .toList();
    }

    // ---------------------------------------------------------------- results

    /**
     * A student's results, optionally for one exam. Students and parents only see submitted marks of
     * exams whose results are published.
     */
    public StudentResult studentResult(User user, String studentId, String examId) {
        Student student = guard.checkStudentAccess(user, studentId);
        if (examId != null) {
            store.exams.getById(examId);
        }
        boolean familyView = user.getRole() == Role.STUDENT || user.getRole() == Role.PARENT;
        Map<String, Exam> exams = examsById();
        List<SubjectResult> subjects = store.marks.stream()
                .filter(m -> m.studentId().equals(studentId))
                .filter(m -> examId == null || m.examId().equals(examId))
                .filter(m -> !familyView || (exams.get(m.examId()).isPublished() && MarksRecord.SUBMITTED.equals(m.status())))
                .map(m -> toSubjectResult(m, exams.get(m.examId()), store.schedules.getById(m.scheduleId())))
                .sorted(Comparator.comparing(SubjectResult::date))
                .toList();

        int totalMax = subjects.stream().mapToInt(SubjectResult::maxMarks).sum();
        double totalObtained = subjects.stream()
                .mapToDouble(r -> r.obtainedMarks() == null ? 0 : r.obtainedMarks())
                .sum();
        Double percentage = subjects.isEmpty() ? null : Grading.percentage(totalObtained, totalMax);
        String grade = percentage == null ? null : Grading.bandFor(percentage).grade();
        return new StudentResult(student.id(), student.name(), student.className(), subjects, totalMax, totalObtained,
                percentage, grade);
    }

    /** Ranked results of a class for one exam. Students with no marks at all are left out, not invented. */
    public List<ClassResultRow> classResults(User user, String examId, String className) {
        store.exams.getById(examId);
        guard.checkCanManageClass(user, className);
        Map<String, ExamSchedule> papers = store.schedules.stream()
                .filter(s -> s.examId().equals(examId) && s.className().equals(className))
                .collect(Collectors.toMap(ExamSchedule::id, Function.identity()));
        Map<String, List<MarksRecord>> byStudent = store.marks.stream()
                .filter(m -> papers.containsKey(m.scheduleId()))
                .collect(Collectors.groupingBy(MarksRecord::studentId));

        List<ClassResultRow> unranked = store.studentsOf(className).stream()
                .filter(st -> byStudent.containsKey(st.id()))
                .map(st -> {
                    List<MarksRecord> marks = byStudent.get(st.id());
                    int max = marks.stream().mapToInt(MarksRecord::maxMarks).sum();
                    double obtained = marks.stream().mapToDouble(m -> m.obtainedMarks() == null ? 0 : m.obtainedMarks()).sum();
                    boolean passedAll = marks.stream().allMatch(m -> !m.absent()
                            && m.obtainedMarks() >= papers.get(m.scheduleId()).passingMarks());
                    double pct = Grading.percentage(obtained, max);
                    return new ClassResultRow(0, st.id(), st.name(), st.rollNumber(), max, obtained, pct,
                            Grading.bandFor(pct).grade(), passedAll);
                })
                .sorted(Comparator.comparingDouble(ClassResultRow::percentage).reversed())
                .toList();

        // Standard competition ranking: equal percentages share a rank.
        List<ClassResultRow> ranked = new ArrayList<>();
        for (int i = 0; i < unranked.size(); i++) {
            ClassResultRow row = unranked.get(i);
            int rank = i > 0 && row.percentage() == unranked.get(i - 1).percentage() ? ranked.get(i - 1).rank() : i + 1;
            ranked.add(new ClassResultRow(rank, row.studentId(), row.studentName(), row.rollNumber(),
                    row.totalMaxMarks(), row.totalObtained(), row.percentage(), row.grade(), row.passedAll()));
        }
        return ranked;
    }

    private static SubjectResult toSubjectResult(MarksRecord m, Exam exam, ExamSchedule paper) {
        Double percentage = m.absent() ? null : Grading.percentage(m.obtainedMarks(), m.maxMarks());
        String grade = m.absent() ? "AB" : Grading.bandFor(percentage).grade();
        boolean passed = !m.absent() && m.obtainedMarks() >= paper.passingMarks();
        return new SubjectResult(exam.id(), exam.name(), m.subject(), paper.date(), m.maxMarks(), paper.passingMarks(),
                m.obtainedMarks(), m.absent(), percentage, grade, passed);
    }

    // ---------------------------------------------------------------- helpers

    private Exam withLiveStatus(Exam exam) {
        return exam.withStatus(statusFor(exam.startDate(), exam.endDate()));
    }

    private ExamSchedule withLiveStatus(ExamSchedule paper) {
        return paper.withStatus(statusFor(paper.date(), paper.date()));
    }

    private String statusFor(LocalDate start, LocalDate end) {
        LocalDate today = LocalDate.now(clock);
        if (today.isBefore(start)) {
            return "Upcoming";
        }
        return today.isAfter(end) ? "Completed" : "Ongoing";
    }

    private Map<String, Exam> examsById() {
        return store.exams.stream().collect(Collectors.toMap(Exam::id, Function.identity()));
    }

    private static String academicYearOr(String academicYear) {
        return academicYear == null || academicYear.isBlank() ? ReferenceData.ACADEMIC_YEAR : academicYear;
    }
}
