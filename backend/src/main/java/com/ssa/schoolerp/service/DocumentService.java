package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.AttendanceDtos.Stats;
import com.ssa.schoolerp.dto.ExamDtos.SubjectResult;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Certificate;
import com.ssa.schoolerp.model.Exam;
import com.ssa.schoolerp.model.ReferenceData;
import com.ssa.schoolerp.model.ReportCardNote;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import jakarta.validation.constraints.NotBlank;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

/** Report cards (CBSE style) and issued certificates (Transfer Certificate, Bonafide). */
@Service
@Transactional
public class DocumentService {

    public record NoteRequest(@NotBlank String term, String academicYear, String remark,
                              Map<String, String> coScholastic) {
    }

    public record CertificateRequest(@NotBlank String type, String reason, String conduct, LocalDate leavingDate,
                                     String remarks) {
    }

    private final DataStore store;
    private final AccessGuard guard;
    private final ExamService exams;
    private final AttendanceService attendance;
    private final SettingsService settings;
    private final AuthService auth;
    private final Clock clock;

    public DocumentService(DataStore store, AccessGuard guard, ExamService exams, AttendanceService attendance,
                           SettingsService settings, AuthService auth, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.exams = exams;
        this.attendance = attendance;
        this.settings = settings;
        this.auth = auth;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- report card

    /**
     * Everything a printed report card needs for one academic year: school header, student, every exam of the
     * year as a column, marks per subject, totals, attendance and the class teacher's notes. Students and parents
     * only see exams whose results are published.
     */
    public Map<String, Object> reportCard(User user, String studentId, String academicYear) {
        Student student = guard.checkStudentAccess(user, studentId);
        String year = settings.yearOr(academicYear);
        Map<String, Exam> yearExams = store.exams.stream()
                .filter(e -> year.equals(e.academicYear()))
                .collect(Collectors.toMap(Exam::id, e -> e));
        List<SubjectResult> results = exams.studentResult(user, studentId, null).subjects().stream()
                .filter(r -> yearExams.containsKey(r.examId()))
                .toList();

        // Columns: the exams that have at least one result, in date order.
        List<Exam> columns = results.stream().map(r -> yearExams.get(r.examId())).distinct()
                .sorted(Comparator.comparing(Exam::startDate)).toList();
        Map<String, Map<String, SubjectResult>> bySubject = new TreeMap<>();
        results.forEach(r -> bySubject.computeIfAbsent(r.subject(), s -> new LinkedHashMap<>()).put(r.examId(), r));

        List<Map<String, Object>> subjects = new ArrayList<>();
        double grandObtained = 0;
        int grandMax = 0;
        List<String> failed = new ArrayList<>();
        for (Map.Entry<String, Map<String, SubjectResult>> entry : bySubject.entrySet()) {
            double obtained = 0;
            int max = 0;
            boolean passedAll = true;
            for (SubjectResult r : entry.getValue().values()) {
                obtained += r.obtainedMarks() == null ? 0 : r.obtainedMarks();
                max += r.maxMarks();
                passedAll &= r.passed();
            }
            double pct = Grading.percentage(obtained, max);
            if (!passedAll) failed.add(entry.getKey());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("subject", entry.getKey());
            row.put("marks", entry.getValue());
            row.put("totalObtained", obtained);
            row.put("totalMax", max);
            row.put("percentage", pct);
            row.put("grade", Grading.bandFor(pct).grade());
            subjects.add(row);
            grandObtained += obtained;
            grandMax += max;
        }

        int startYear = Integer.parseInt(year.substring(0, 4));
        Stats attendanceStats = attendance.statsForStudent(user, studentId, LocalDate.of(startYear, 4, 1),
                LocalDate.of(startYear + 1, 3, 31));
        String classTeacher = store.classes.findById(student.className()).map(SchoolClass::classTeacherId)
                .flatMap(store.teachers::findById).map(Teacher::name).orElse(null);
        Double percentage = grandMax == 0 ? null : Grading.percentage(grandObtained, grandMax);

        Map<String, Object> overall = new LinkedHashMap<>();
        overall.put("totalObtained", grandObtained);
        overall.put("totalMax", grandMax);
        overall.put("percentage", percentage);
        overall.put("grade", percentage == null ? null : Grading.bandFor(percentage).grade());
        overall.put("result", subjects.isEmpty() ? null : failed.isEmpty() ? "Pass" : "Needs improvement");
        overall.put("failedSubjects", failed);

        Map<String, Object> card = new LinkedHashMap<>();
        card.put("school", settings.get());
        card.put("academicYear", year);
        card.put("student", student);
        card.put("classTeacher", classTeacher);
        card.put("exams", columns);
        card.put("subjects", subjects);
        card.put("overall", overall);
        card.put("attendance", attendanceStats);
        card.put("notes", store.reportCardNotes.where("e.studentId = ?1 and e.academicYear = ?2", studentId, year)
                .stream().sorted(Comparator.comparing(ReportCardNote::term)).toList());
        card.put("coScholasticAreas", ReferenceData.CO_SCHOLASTIC_AREAS);
        card.put("gradeBands", Grading.BANDS);
        return card;
    }

    /** The class teacher (any teacher of the class) or an admin writes co-scholastic grades and a remark. */
    public ReportCardNote saveNote(User user, String studentId, NoteRequest request) {
        Student student = store.students.getById(studentId);
        guard.checkCanManageClass(user, student.className());
        if (!ReferenceData.REPORT_TERMS.contains(request.term())) {
            throw ApiErrors.badRequest("Term must be one of " + ReferenceData.REPORT_TERMS);
        }
        Map<String, String> grades = request.coScholastic() == null ? Map.of() : request.coScholastic();
        grades.forEach((area, grade) -> {
            if (!ReferenceData.CO_SCHOLASTIC_AREAS.contains(area)) {
                throw ApiErrors.badRequest("Unknown co-scholastic area: " + area);
            }
            if (!ReferenceData.CO_SCHOLASTIC_GRADES.contains(grade)) {
                throw ApiErrors.badRequest("Co-scholastic grades are A, B or C");
            }
        });
        String year = settings.yearOr(request.academicYear());
        String remark = request.remark() == null ? null : request.remark().trim();
        if (remark != null && remark.length() > 1000) {
            throw ApiErrors.badRequest("The remark is too long (1000 characters at most)");
        }
        return store.reportCardNotes.save(new ReportCardNote(studentId, year, request.term(), remark, grades,
                user.getName(), LocalDateTime.now(clock)));
    }

    // ---------------------------------------------------------------- certificates

    /** Issues a certificate. A Transfer Certificate also marks the student as Left and disables their login. */
    public Certificate issue(User admin, String studentId, CertificateRequest request) {
        Student student = store.students.getById(studentId);
        String type = request.type().trim().toUpperCase();
        if (!Set.of(Certificate.TRANSFER, Certificate.BONAFIDE).contains(type)) {
            throw ApiErrors.badRequest("Certificate type must be TC or BONAFIDE");
        }
        if (Certificate.TRANSFER.equals(type) && !student.isActive()) {
            throw ApiErrors.conflict(student.name() + " is already " + student.status().toLowerCase());
        }
        if (request.conduct() != null && !ReferenceData.CONDUCT_OPTIONS.contains(request.conduct())) {
            throw ApiErrors.badRequest("Conduct must be one of " + ReferenceData.CONDUCT_OPTIONS);
        }
        LocalDate today = LocalDate.now(clock);
        LocalDate leaving = Certificate.TRANSFER.equals(type)
                ? (request.leavingDate() != null ? request.leavingDate() : today)
                : null;
        Certificate certificate = new Certificate(store.nextId(Certificate.TRANSFER.equals(type) ? "TC" : "BC"), type,
                student.id(), student.name(), student.className(), student.dateOfBirth(),
                student.guardian() == null ? null : student.guardian().name(), student.admissionDate(),
                settings.currentAcademicYear(), today, leaving, request.reason(), request.conduct(), request.remarks(),
                admin.getName());
        store.certificates.save(certificate);
        if (Certificate.TRANSFER.equals(type)) {
            store.students.save(student.withStatus(Student.LEFT));
            store.accounts.where("e.profileId = ?1", studentId).forEach(account -> {
                store.accounts.save(account.withActive(false));
                auth.signOutEverywhere(account.id());
            });
        }
        return certificate;
    }

    public List<Certificate> certificatesOf(User user, String studentId) {
        guard.checkStudentAccess(user, studentId);
        return store.certificates.where("e.studentId = ?1 order by e.issuedOn desc", studentId);
    }

    public List<Certificate> recentCertificates() {
        return store.certificates.whereLimited(200, "1 = 1 order by e.issuedOn desc");
    }

    /** A certificate with the school header, ready to print. */
    public Map<String, Object> printable(User user, String certificateId) {
        Certificate certificate = store.certificates.getById(certificateId);
        guard.checkStudentAccess(user, certificate.studentId());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("certificate", certificate);
        result.put("school", settings.get());
        return result;
    }
}
