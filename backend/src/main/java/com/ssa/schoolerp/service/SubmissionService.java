package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.OperationsDtos.SubmissionRequest;
import com.ssa.schoolerp.dto.OperationsDtos.SubmissionReview;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.HomeworkSubmission;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Students hand in homework (text and photos); the teacher reviews it or asks for it to be redone. */
@Service
@Transactional
public class SubmissionService {

    /** A student's row on the teacher's checking sheet; {@code submission} is null if nothing was handed in. */
    public record SubmissionRow(String studentId, String studentName, Integer rollNumber, HomeworkSubmission submission) {
    }

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;
    private final FileService files;
    private final NotificationService notifications;

    public SubmissionService(DataStore store, AccessGuard guard, Clock clock, FileService files,
                             NotificationService notifications) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.files = files;
        this.notifications = notifications;
    }

    /** By the student, or a parent for their child ({@code studentId}). Re-submitting replaces it until reviewed. */
    public HomeworkSubmission submit(User user, String homeworkId, String studentId, SubmissionRequest request) {
        Homework homework = store.homework.getById(homeworkId);
        String id = switch (user.getRole()) {
            case STUDENT -> user.getProfileId();
            case PARENT -> studentId;
            case TEACHER, ADMIN -> throw ApiErrors.forbidden();
        };
        if (id == null) {
            throw ApiErrors.badRequest("Choose the child this homework is for");
        }
        Student student = guard.checkStudentAccess(user, id);
        if (!homework.className().equals(student.className())) {
            throw ApiErrors.badRequest("This homework is not for class " + student.className());
        }
        List<String> fileIds = request.fileIds() == null ? List.of() : request.fileIds().stream().distinct().toList();
        boolean noText = request.text() == null || request.text().isBlank();
        if (noText && fileIds.isEmpty()) {
            throw ApiErrors.badRequest("Write an answer or attach a photo");
        }
        if (fileIds.size() > 10) {
            throw ApiErrors.badRequest("Attach at most 10 files");
        }
        HomeworkSubmission existing = store.submissions.findById(HomeworkSubmission.idFor(homeworkId, student.id()))
                .orElse(null);
        if (existing != null && HomeworkSubmission.REVIEWED.equals(existing.status())) {
            throw ApiErrors.conflict("The teacher has already checked this homework");
        }
        // Files already on this submission (e.g. the student's photos, kept when a parent edits it) are fine;
        // new ones must be the user's own uploads.
        List<String> previous = existing == null ? List.of() : existing.fileIds();
        files.checkOwnFiles(user, fileIds.stream().filter(f -> !previous.contains(f)).toList());
        LocalDateTime now = LocalDateTime.now(clock);
        boolean late = homework.dueDate() != null && now.toLocalDate().isAfter(homework.dueDate());
        return store.submissions.save(new HomeworkSubmission(homeworkId, student.id(), student.name(),
                student.className(), noText ? null : request.text().trim(), fileIds, now, late,
                HomeworkSubmission.SUBMITTED, null, null, null, null));
    }

    /** The whole class for a homework (teacher of the class or admin), in roll order. */
    public List<SubmissionRow> forHomework(User user, String homeworkId) {
        Homework homework = store.homework.getById(homeworkId);
        guard.checkCanManageClass(user, homework.className());
        Map<String, HomeworkSubmission> byStudent = store.submissions.where("e.homeworkId = ?1", homeworkId).stream()
                .collect(Collectors.toMap(HomeworkSubmission::studentId, Function.identity()));
        return store.studentsOf(homework.className()).stream()
                .map(s -> new SubmissionRow(s.id(), s.name(), s.rollNumber(), byStudent.get(s.id())))
                .toList();
    }

    /** A student's submissions (to show "submitted / checked" against each homework). */
    public List<HomeworkSubmission> forStudent(User user, String studentId) {
        String id = studentId != null ? studentId : user.getProfileId();
        guard.checkStudentAccess(user, id);
        return store.submissions.where("e.studentId = ?1 order by e.submittedAt desc", id);
    }

    public HomeworkSubmission review(User user, String submissionId, SubmissionReview review) {
        HomeworkSubmission submission = store.submissions.getById(submissionId);
        Homework homework = store.homework.getById(submission.homeworkId());
        guard.checkCanManageClass(user, homework.className());
        HomeworkSubmission saved = store.submissions.save(submission.reviewed(review.status(),
                blankToNull(review.grade()), blankToNull(review.feedback()), user.getName(), LocalDateTime.now(clock)));
        store.students.findById(submission.studentId()).ifPresent(s -> notifications.notifyFamily(s,
                (HomeworkSubmission.REDO.equals(review.status()) ? "Redo homework: " : "Homework checked: ")
                        + homework.subject(),
                homework.title() + (review.feedback() == null || review.feedback().isBlank() ? "" : " — " + review.feedback()),
                NotificationService.HOMEWORK, "/homework", false));
        return saved;
    }

    /** Pending homework count for a student: due today or later and not yet submitted. */
    public long pendingCount(Student student) {
        LocalDate today = LocalDate.now(clock);
        java.util.Set<String> done = store.submissions.where("e.studentId = ?1", student.id()).stream()
                .map(HomeworkSubmission::homeworkId).collect(Collectors.toSet());
        return store.homework.where("e.className = ?1 and e.dueDate >= ?2", student.className(), today).stream()
                .filter(h -> !done.contains(h.id())).count();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
