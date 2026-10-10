package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.model.Certificate;
import com.ssa.schoolerp.model.ReportCardNote;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.DocumentService;
import com.ssa.schoolerp.service.DocumentService.CertificateRequest;
import com.ssa.schoolerp.service.DocumentService.NoteRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
import java.util.Map;

/** Report cards and certificates. */
@RestController
@RequestMapping("/api")
public class DocumentController {

    private final DocumentService documents;

    public DocumentController(DocumentService documents) {
        this.documents = documents;
    }

    @GetMapping("/report-cards/{studentId}")
    public ApiResponse<Map<String, Object>> reportCard(@CurrentUser User user, @PathVariable String studentId,
                                                       @RequestParam(required = false) String academicYear) {
        return ApiResponse.of(documents.reportCard(user, studentId, academicYear));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PutMapping("/report-cards/{studentId}/notes")
    public ApiResponse<ReportCardNote> saveNote(@CurrentUser User user, @PathVariable String studentId,
                                                @Valid @RequestBody NoteRequest request) {
        return ApiResponse.success("Report card notes saved", documents.saveNote(user, studentId, request));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/students/{studentId}/certificates")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Certificate> issue(@CurrentUser User user, @PathVariable String studentId,
                                          @Valid @RequestBody CertificateRequest request) {
        return ApiResponse.success("Certificate issued", documents.issue(user, studentId, request));
    }

    @GetMapping("/students/{studentId}/certificates")
    public ApiResponse<List<Certificate>> certificatesOf(@CurrentUser User user, @PathVariable String studentId) {
        return ApiResponse.of(documents.certificatesOf(user, studentId));
    }

    @RequireRole(Role.ADMIN)
    @GetMapping("/certificates")
    public ApiResponse<List<Certificate>> recent() {
        return ApiResponse.of(documents.recentCertificates());
    }

    @GetMapping("/certificates/{id}")
    public ApiResponse<Map<String, Object>> printable(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.of(documents.printable(user, id));
    }
}
