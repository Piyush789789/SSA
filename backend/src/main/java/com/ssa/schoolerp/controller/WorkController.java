package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.OperationsDtos.AdmitCards;
import com.ssa.schoolerp.dto.OperationsDtos.ImportRequest;
import com.ssa.schoolerp.dto.OperationsDtos.ImportResult;
import com.ssa.schoolerp.dto.OperationsDtos.SeatingPlan;
import com.ssa.schoolerp.dto.OperationsDtos.SeatingRequest;
import com.ssa.schoolerp.dto.OperationsDtos.SubmissionRequest;
import com.ssa.schoolerp.dto.OperationsDtos.SubmissionReview;
import com.ssa.schoolerp.dto.OperationsDtos.UploadedFile;
import com.ssa.schoolerp.model.HomeworkSubmission;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.StoredFile;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.ExamSeatingService;
import com.ssa.schoolerp.service.FileService;
import com.ssa.schoolerp.service.ImportService;
import com.ssa.schoolerp.service.SubmissionService;
import com.ssa.schoolerp.service.SubmissionService.SubmissionRow;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

/** Uploads, homework submissions, exam seating and admit cards, and bulk student import. */
@RestController
@RequestMapping("/api")
public class WorkController {

    private final FileService files;
    private final SubmissionService submissions;
    private final ExamSeatingService seating;
    private final ImportService imports;

    public WorkController(FileService files, SubmissionService submissions, ExamSeatingService seating,
                          ImportService imports) {
        this.files = files;
        this.submissions = submissions;
        this.seating = seating;
        this.imports = imports;
    }

    // ---------------------------------------------------------------- files

    /** Multipart field "file": a photo (JPEG/PNG/WebP/HEIC) or PDF up to 5 MB. */
    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UploadedFile> upload(@CurrentUser User user, @RequestPart("file") MultipartFile file) {
        return ApiResponse.success("Uploaded", files.upload(user, file));
    }

    /** The file itself (signed-in users; ids are unguessable and only handed out with the homework they belong to). */
    @GetMapping("/files/{id}")
    public ResponseEntity<byte[]> download(@PathVariable String id) {
        StoredFile file = files.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(file.fileName(), StandardCharsets.UTF_8).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=86400")
                .body(file.content());
    }

    // ---------------------------------------------------------------- homework submissions

    /** The student (or a parent, with studentId) hands in a homework. */
    @RequireRole({Role.STUDENT, Role.PARENT})
    @PutMapping("/homework/{homeworkId}/submission")
    public ApiResponse<HomeworkSubmission> submit(@CurrentUser User user, @PathVariable String homeworkId,
                                                  @RequestParam(required = false) String studentId,
                                                  @Valid @RequestBody SubmissionRequest request) {
        return ApiResponse.success("Homework submitted", submissions.submit(user, homeworkId, studentId, request));
    }

    /** The class's checking sheet for a homework. */
    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/homework/{homeworkId}/submissions")
    public ApiResponse<List<SubmissionRow>> forHomework(@CurrentUser User user, @PathVariable String homeworkId) {
        return ApiResponse.of(submissions.forHomework(user, homeworkId));
    }

    /** A student's own submissions (parents pass studentId). */
    @GetMapping("/homework-submissions")
    public ApiResponse<List<HomeworkSubmission>> forStudent(@CurrentUser User user,
                                                            @RequestParam(required = false) String studentId) {
        return ApiResponse.of(submissions.forStudent(user, studentId));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PostMapping("/homework-submissions/{id}/review")
    public ApiResponse<HomeworkSubmission> review(@CurrentUser User user, @PathVariable String id,
                                                  @Valid @RequestBody SubmissionReview review) {
        return ApiResponse.success("Review saved", submissions.review(user, id, review));
    }

    // ---------------------------------------------------------------- exam seating & admit cards

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/exams/{examId}/seating")
    public ApiResponse<SeatingPlan> seatingPlan(@PathVariable String examId) {
        return ApiResponse.of(seating.plan(examId));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/exams/{examId}/seating")
    public ApiResponse<SeatingPlan> arrangeSeating(@PathVariable String examId,
                                                   @Valid @RequestBody SeatingRequest request) {
        return ApiResponse.success("Seating arranged", seating.arrange(examId, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/exams/{examId}/seating")
    public ApiResponse<Void> clearSeating(@PathVariable String examId) {
        seating.clear(examId);
        return ApiResponse.success("Seating cleared");
    }

    /** Printable admit cards for a class (staff) or one student (the student, their parent, staff). */
    @GetMapping("/exams/{examId}/admit-cards")
    public ApiResponse<AdmitCards> admitCards(@CurrentUser User user, @PathVariable String examId,
                                              @RequestParam(required = false) String className,
                                              @RequestParam(required = false) String studentId) {
        return ApiResponse.of(seating.admitCards(user, examId, className, studentId));
    }

    // ---------------------------------------------------------------- bulk import

    /** CSV text (spreadsheet saved as CSV). Use dryRun first: nothing is saved and every row is checked. */
    @RequireRole(Role.ADMIN)
    @PostMapping("/import/students")
    public ApiResponse<ImportResult> importStudents(@Valid @RequestBody ImportRequest request) {
        ImportResult result = imports.importStudents(request);
        return ApiResponse.success(result.dryRun()
                ? result.valid() + " of " + result.total() + " rows are ready to import"
                : result.created() + " students admitted", result);
    }

    @RequireRole(Role.ADMIN)
    @GetMapping(value = "/import/students/template", produces = "text/csv")
    public ResponseEntity<String> importTemplate() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"students-template.csv\"")
                .body(imports.template());
    }
}
