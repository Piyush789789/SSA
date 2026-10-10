package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.ExamDtos.ClassResultRow;
import com.ssa.schoolerp.dto.ExamDtos.MarksSaveRequest;
import com.ssa.schoolerp.dto.ExamDtos.MarksSheet;
import com.ssa.schoolerp.dto.ExamDtos.StudentResult;
import com.ssa.schoolerp.model.Exam;
import com.ssa.schoolerp.model.ExamSchedule;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.ExamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Exams, their papers (schedules), marks entry and results. */
@RestController
@RequestMapping("/api")
public class ExamController {

    private final ExamService exams;

    public ExamController(ExamService exams) {
        this.exams = exams;
    }

    // ---------------------------------------------------------------- exams

    @GetMapping("/exams")
    public ApiResponse<List<Exam>> exams(@CurrentUser User user) {
        return ApiResponse.of(exams.listExams(user));
    }

    @GetMapping("/exams/{id}")
    public ApiResponse<Exam> exam(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.of(exams.getExam(user, id));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/exams")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Exam> createExam(@Valid @RequestBody Exam request) {
        return ApiResponse.success("Exam created", exams.createExam(request));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/exams/{id}")
    public ApiResponse<Exam> updateExam(@PathVariable String id, @Valid @RequestBody Exam request) {
        return ApiResponse.success("Exam updated", exams.updateExam(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/exams/{id}")
    public ApiResponse<Void> deleteExam(@PathVariable String id) {
        exams.deleteExam(id);
        return ApiResponse.success("Exam deleted");
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/exams/{id}/publish")
    public ApiResponse<Exam> publish(@PathVariable String id) {
        return ApiResponse.success("Results published", exams.setResultsPublished(id, true));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/exams/{id}/unpublish")
    public ApiResponse<Exam> unpublish(@PathVariable String id) {
        return ApiResponse.success("Results moved back to draft", exams.setResultsPublished(id, false));
    }

    // ---------------------------------------------------------------- papers

    @GetMapping("/exams/{id}/schedules")
    public ApiResponse<List<ExamSchedule>> examSchedules(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.of(exams.listSchedules(user, id, null));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/exams/{id}/schedules")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExamSchedule> addSchedule(@PathVariable String id, @Valid @RequestBody ExamSchedule request) {
        return ApiResponse.success("Paper scheduled", exams.addSchedule(id, request));
    }

    @GetMapping("/exam-schedules")
    public ApiResponse<List<ExamSchedule>> schedules(@CurrentUser User user,
                                                     @RequestParam(required = false) String examId,
                                                     @RequestParam(required = false) String className) {
        return ApiResponse.of(exams.listSchedules(user, examId, className));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/exam-schedules/{id}")
    public ApiResponse<ExamSchedule> updateSchedule(@PathVariable String id, @Valid @RequestBody ExamSchedule request) {
        return ApiResponse.success("Paper updated", exams.updateSchedule(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/exam-schedules/{id}")
    public ApiResponse<Void> deleteSchedule(@PathVariable String id) {
        exams.deleteSchedule(id);
        return ApiResponse.success("Paper deleted");
    }

    // ---------------------------------------------------------------- marks

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/exam-schedules/{id}/marks")
    public ApiResponse<MarksSheet> marksSheet(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.of(exams.marksSheet(user, id));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PutMapping("/exam-schedules/{id}/marks")
    public ApiResponse<MarksSheet> saveMarks(@CurrentUser User user, @PathVariable String id,
                                             @Valid @RequestBody MarksSaveRequest request) {
        String message = request.submit() ? "Marks submitted" : "Marks saved as draft";
        return ApiResponse.success(message, exams.saveMarks(user, id, request));
    }

    // ---------------------------------------------------------------- results

    @GetMapping("/results/students/{studentId}")
    public ApiResponse<StudentResult> studentResult(@CurrentUser User user, @PathVariable String studentId,
                                                    @RequestParam(required = false) String examId) {
        return ApiResponse.of(exams.studentResult(user, studentId, examId));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/results/exams/{examId}")
    public ApiResponse<List<ClassResultRow>> classResults(@CurrentUser User user, @PathVariable String examId,
                                                          @RequestParam String className) {
        return ApiResponse.of(exams.classResults(user, examId, className));
    }
}
