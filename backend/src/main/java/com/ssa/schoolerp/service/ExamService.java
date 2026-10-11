package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.ExamDtos.ClassResultRow;
import com.ssa.schoolerp.dto.ExamDtos.MarksEntry;
import com.ssa.schoolerp.dto.ExamDtos.MarksProgress;
import com.ssa.schoolerp.dto.ExamDtos.MarksSaveRequest;
import com.ssa.schoolerp.dto.ExamDtos.MarksSheet;
import com.ssa.schoolerp.dto.ExamDtos.MarksSheetRow;
import com.ssa.schoolerp.dto.ExamDtos.MarksImportRequest;
import com.ssa.schoolerp.dto.ExamDtos.MarksImportResult;
import com.ssa.schoolerp.dto.ExamDtos.MarksImportRow;
import com.ssa.schoolerp.dto.ExamDtos.MarksImportRowResult;
import com.ssa.schoolerp.model.Question;
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
    private final NotificationService notifications;
    private final SettingsService settings;

    public ExamService(DataStore store, AccessGuard guard, Clock clock, SettingsService settings, NotificationService notifications) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.notifications = notifications;
        this.settings = settings;
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
        Exam exam = new Exam(store.nextId("EXM"), request.name(), request.type(), settings.yearOr(request.academicYear()),
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
        Exam exam = new Exam(id, request.name(), request.type(), settings.yearOr(request.academicYear()),
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
        boolean wasPublished = exam.isPublished();
        Exam updated = exam.withResultsStatus(published ? Exam.RESULTS_PUBLISHED : Exam.RESULTS_DRAFT);
        Exam saved = store.exams.save(updated);
        if (published && !wasPublished) {
            notifications.notifyClassFamilies(saved.classes(), "Results published",
                    saved.name() + " results are now available.", NotificationService.RESULTS, "/results");
        }
        return withLiveStatus(saved);
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
        checkQuestions(request.questions(), request.maxMarks());
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
        // An edit of the paper without a "questions" field keeps the saved breakdown.
        List<Question> questions = request.questionsMissing() ? existing.questions() : request.questions();
        if (!questions.equals(existing.questions())) {
            checkQuestionsReplaceable(id, questions);
        }
        checkQuestions(questions, request.maxMarks());
        ExamSchedule schedule = request.withIds(id, existing.examId()).withStatus(null).withQuestions(questions);
        store.schedules.save(schedule);
        // Keep the stored copy of maxMarks on each marks record in step with the paper.
        store.marks.where("e.scheduleId = ?1", id).forEach(m -> store.marks.save(m.copyWith(request.maxMarks())));
        return withLiveStatus(schedule);
    }

    /**
     * Sets the paper's questions (e.g. Q1-Q5 with their marks), or removes them with an empty list. The questions
     * must add up to the paper's maximum marks. Teachers of the subject (before results are published) and admins.
     */
    public ExamSchedule setQuestions(User user, String scheduleId, List<Question> questions) {
        ExamSchedule paper = store.schedules.getById(scheduleId);
        checkCanEnterMarks(user, paper);
        List<Question> cleaned = questions.stream()
                .map(q -> new Question(q.label().trim(), q.maxMarks()))
                .toList();
        checkQuestions(cleaned, paper.maxMarks());
        checkQuestionsReplaceable(scheduleId, cleaned);
        return withLiveStatus(store.schedules.save(paper.withQuestions(cleaned)));
    }

    private static void checkQuestions(List<Question> questions, int maxMarks) {
        if (questions.isEmpty()) return;
        if (questions.size() > 50) {
            throw ApiErrors.badRequest("A paper can have at most 50 questions");
        }
        Set<String> labels = new HashSet<>();
        for (Question q : questions) {
            if (!labels.add(q.label().trim().toLowerCase())) {
                throw ApiErrors.badRequest("Question " + q.label() + " is listed twice");
            }
        }
        double sum = questions.stream().mapToDouble(Question::maxMarks).sum();
        if (Math.abs(sum - maxMarks) > 0.001) {
            throw ApiErrors.badRequest("The questions add up to " + Grading.round1(sum) + " marks but the paper is out of "
                    + maxMarks + ". Make them equal.");
        }
    }

    /** Question-wise marks already entered must still fit: same number of questions, none above the new maximum. */
    private void checkQuestionsReplaceable(String scheduleId, List<Question> questions) {
        for (MarksRecord m : store.marks.where("e.scheduleId = ?1", scheduleId)) {
            List<Double> marks = m.questionMarks();
            if (marks == null) continue;
            boolean fits = marks.size() == questions.size();
            for (int i = 0; fits && i < marks.size(); i++) {
                fits = marks.get(i) == null || marks.get(i) <= questions.get(i).maxMarks();
            }
            if (!fits) {
                throw ApiErrors.conflict("Question-wise marks are already entered for " + m.studentName()
                        + " and others. Clear them on the marks sheet before changing the questions.");
            }
        }
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
        Map<String, Integer> entered = marksCountBySchedule();
        Map<String, Integer> classSizes = store.studentCountsByClass();
        return store.schedules.stream()
                .filter(s -> teacher.teaches(s.className(), s.subject()) && !s.date().isAfter(today))
                .map(s -> new PendingMarksEntry(s.id(), exams.get(s.examId()).name(), s.subject(), s.className(),
                        s.date(), entered.getOrDefault(s.id(), 0), classSizes.getOrDefault(s.className(), 0)))
                .filter(p -> p.entered() < p.totalStudents())
                .sorted(Comparator.comparing(PendingMarksEntry::date))
                .toList();
    }

    /** Marks records per paper, counted by the database. */
    private Map<String, Integer> marksCountBySchedule() {
        return store.marks.aggregate("select e.scheduleId, count(e) from %s e group by e.scheduleId").stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> ((Long) row[1]).intValue()));
    }

    // ---------------------------------------------------------------- marks

    /** Every student of the paper's class, with their marks if entered, so new papers can be filled in. */
    public MarksSheet marksSheet(User user, String scheduleId) {
        ExamSchedule paper = store.schedules.getById(scheduleId);
        guard.checkCanManageClass(user, paper.className());
        Map<String, MarksRecord> existing = store.marks.where("e.scheduleId = ?1", scheduleId).stream()
                .collect(Collectors.toMap(MarksRecord::studentId, Function.identity()));
        List<MarksSheetRow> rows = store.studentsOf(paper.className()).stream()
                .map(st -> {
                    MarksRecord m = existing.get(st.id());
                    return m == null
                            ? new MarksSheetRow(st.id(), st.name(), st.rollNumber(), null, false, "Not Entered", null)
                            : new MarksSheetRow(st.id(), st.name(), st.rollNumber(), m.obtainedMarks(), m.absent(),
                            m.status(), m.questionMarks());
                })
                .toList();
        return new MarksSheet(withLiveStatus(paper), store.exams.getById(paper.examId()).name(), rows);
    }

    public MarksSheet saveMarks(User user, String scheduleId, MarksSaveRequest request) {
        ExamSchedule paper = store.schedules.getById(scheduleId);
        checkCanEnterMarks(user, paper);
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
            String problem = entryProblem(paper, entry);
            if (problem != null) {
                throw ApiErrors.badRequest(student.name() + ": " + problem);
            }
            List<Double> perQuestion = entry.absent() ? null : questionMarksOf(paper, entry);
            Double total = entry.absent() ? null : perQuestion != null ? Double.valueOf(sum(perQuestion)) : entry.obtainedMarks();
            if (!entry.absent() && total == null) {
                continue; // left blank: not entered yet, not zero
            }
            records.add(new MarksRecord(MarksRecord.idFor(scheduleId, student.id()), paper.examId(), scheduleId,
                    paper.className(), paper.subject(), student.id(), student.name(), student.rollNumber(),
                    paper.maxMarks(), total, entry.absent(), status, user.getName()).withQuestionMarks(perQuestion));
        }
        records.forEach(store.marks::save);
        cleared.forEach(store.marks::deleteById);
        return marksSheet(user, scheduleId);
    }

    /** Teachers of the paper's class and subject (until results are published), and admins. */
    private void checkCanEnterMarks(User user, ExamSchedule paper) {
        if (user.getRole() == Role.TEACHER) {
            if (!guard.teacherOf(user).teaches(paper.className(), paper.subject())) {
                throw ApiErrors.forbidden();
            }
            if (store.exams.getById(paper.examId()).isPublished()) {
                throw ApiErrors.conflict("Results for this exam are published; ask an admin to unpublish them first");
            }
        } else {
            guard.checkCanManageClass(user, paper.className());
        }
    }

    /** What is wrong with one student's entry, or null. */
    private static String entryProblem(ExamSchedule paper, MarksEntry entry) {
        if (entry.absent() || entry.clear()) return null;
        List<Double> perQuestion = entry.questionMarks();
        if (perQuestion != null && !perQuestion.stream().allMatch(java.util.Objects::isNull)) {
            List<Question> questions = paper.questions();
            if (questions.isEmpty()) {
                return "this paper has no questions set; enter only the total";
            }
            if (perQuestion.size() != questions.size()) {
                return "expected marks for " + questions.size() + " questions but got " + perQuestion.size();
            }
            for (int i = 0; i < questions.size(); i++) {
                Double v = perQuestion.get(i);
                if (v != null && (v < 0 || v > questions.get(i).maxMarks())) {
                    return questions.get(i).label() + " is out of " + Grading.round1(questions.get(i).maxMarks())
                            + " but has " + Grading.round1(v);
                }
            }
            return null;
        }
        if (entry.obtainedMarks() != null && (entry.obtainedMarks() < 0 || entry.obtainedMarks() > paper.maxMarks())) {
            return "marks must be between 0 and " + paper.maxMarks();
        }
        return null;
    }

    /** The entry's per-question marks when it has any (all-blank counts as none). */
    private static List<Double> questionMarksOf(ExamSchedule paper, MarksEntry entry) {
        List<Double> perQuestion = entry.questionMarks();
        if (perQuestion == null || paper.questions().isEmpty() || perQuestion.stream().allMatch(java.util.Objects::isNull)) {
            return null;
        }
        return perQuestion;
    }

    private static double sum(List<Double> values) {
        return Math.round(values.stream().mapToDouble(v -> v == null ? 0 : v).sum() * 100) / 100.0;
    }

    /**
     * Marks from a spreadsheet. Each row is matched to a student of the class by student ID (or roll number) and
     * checked; the dry run reports problems without saving. The real run saves the valid rows as a draft (the
     * teacher reviews them on the marks sheet and submits).
     */
    public MarksImportResult importMarks(User user, String scheduleId, MarksImportRequest request) {
        ExamSchedule paper = store.schedules.getById(scheduleId);
        checkCanEnterMarks(user, paper);
        if (paper.date().isAfter(LocalDate.now(clock))) {
            throw ApiErrors.badRequest("Marks cannot be entered before the exam date (" + paper.date() + ")");
        }
        List<Student> students = store.studentsOf(paper.className());
        Map<String, Student> byId = students.stream()
                .collect(Collectors.toMap(s -> s.id().toLowerCase(), Function.identity()));
        Map<Integer, Student> byRoll = students.stream().filter(s -> s.rollNumber() != null)
                .collect(Collectors.toMap(Student::rollNumber, Function.identity(), (a, b) -> a));

        List<MarksImportRowResult> results = new ArrayList<>();
        List<MarksEntry> valid = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (MarksImportRow row : request.rows()) {
            boolean hasId = row.studentId() != null && !row.studentId().isBlank();
            Student student = hasId ? byId.get(row.studentId().trim().toLowerCase())
                    : row.rollNumber() != null ? byRoll.get(row.rollNumber()) : null;
            String label = hasId ? row.studentId().trim() : row.rollNumber() != null ? "Roll " + row.rollNumber() : "";
            if (student == null) {
                results.add(new MarksImportRowResult(row.row(), label, null, "ERROR",
                        label.isEmpty() ? "No student ID or roll number" : "Not a student of class " + paper.className(), null));
                continue;
            }
            if (!seen.add(student.id())) {
                results.add(new MarksImportRowResult(row.row(), student.id(), student.name(), "ERROR",
                        "This student appears more than once in the file", null));
                continue;
            }
            MarksEntry entry = new MarksEntry(student.id(), row.total(), row.absent(), false, row.questionMarks());
            String problem = entryProblem(paper, entry);
            List<Double> perQuestion = questionMarksOf(paper, entry);
            Double total = row.absent() ? null : perQuestion != null ? Double.valueOf(sum(perQuestion)) : row.total();
            if (problem == null && !row.absent() && total == null) {
                problem = "No marks in this row";
            }
            if (problem != null) {
                results.add(new MarksImportRowResult(row.row(), student.id(), student.name(), "ERROR", problem, null));
                continue;
            }
            valid.add(entry);
            results.add(new MarksImportRowResult(row.row(), student.id(), student.name(), "OK",
                    row.absent() ? "Absent" : null, total));
        }
        int failed = (int) results.stream().filter(r -> "ERROR".equals(r.status())).count();
        if (request.dryRun() || valid.isEmpty()) {
            return new MarksImportResult(request.dryRun(), results.size(), valid.size(), 0, failed, results);
        }
        saveMarks(user, scheduleId, new MarksSaveRequest(valid, false));
        List<MarksImportRowResult> saved = results.stream()
                .map(r -> "OK".equals(r.status())
                        ? new MarksImportRowResult(r.row(), r.studentId(), r.studentName(), "SAVED", r.message(), r.total())
                        : r)
                .toList();
        return new MarksImportResult(false, results.size(), valid.size(), valid.size(), failed, saved);
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
        List<SubjectResult> subjects = store.marks.where("e.studentId = ?1", studentId).stream()
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
        Map<String, List<MarksRecord>> byStudent = (papers.isEmpty()
                ? List.<MarksRecord>of()
                : store.marks.where("e.scheduleId in ?1", papers.keySet())).stream()
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
                m.obtainedMarks(), m.absent(), percentage, grade, passed, paper.questions(),
                m.absent() ? null : m.questionMarks());
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

}
