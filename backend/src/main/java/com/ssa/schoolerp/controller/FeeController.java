package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.FeeDtos.AssignRequest;
import com.ssa.schoolerp.dto.FeeDtos.ConcessionRequest;
import com.ssa.schoolerp.dto.FeeDtos.DueView;
import com.ssa.schoolerp.dto.FeeDtos.Overview;
import com.ssa.schoolerp.dto.FeeDtos.PaymentRequest;
import com.ssa.schoolerp.dto.FeeDtos.StudentSummary;
import com.ssa.schoolerp.model.Concession;
import com.ssa.schoolerp.model.FeeHead;
import com.ssa.schoolerp.model.FeePayment;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.FeeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;

/** Fees are visible to admins and to families (their own); teachers have no access. */
@RestController
@RequestMapping("/api/fees")
@RequireRole({Role.ADMIN, Role.STUDENT, Role.PARENT})
public class FeeController {

    private final FeeService fees;

    public FeeController(FeeService fees) {
        this.fees = fees;
    }

    // ---------------------------------------------------------------- fee heads

    @GetMapping("/heads")
    public ApiResponse<List<FeeHead>> heads() {
        return ApiResponse.of(fees.heads());
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/heads")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FeeHead> createHead(@Valid @RequestBody FeeHead request) {
        return ApiResponse.success("Fee head created and billed", fees.createHead(request));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/heads/{id}")
    public ApiResponse<FeeHead> updateHead(@PathVariable String id, @Valid @RequestBody FeeHead request) {
        return ApiResponse.success("Fee head updated", fees.updateHead(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/heads/{id}")
    public ApiResponse<Void> deleteHead(@PathVariable String id) {
        fees.deleteHead(id);
        return ApiResponse.success("Fee head deleted");
    }

    // ---------------------------------------------------------------- dues

    /** {@code status}: Paid, Partial, Overdue or Pending. */
    @GetMapping("/dues")
    public ApiResponse<List<DueView>> dues(@CurrentUser User user,
                                           @RequestParam(required = false) String studentId,
                                           @RequestParam(required = false) String className,
                                           @RequestParam(required = false) String status) {
        return ApiResponse.of(fees.dues(user, studentId, className, status));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/dues")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DueView> assign(@Valid @RequestBody AssignRequest request) {
        return ApiResponse.success("Fee assigned", fees.assign(request));
    }

    @GetMapping("/students/{studentId}/summary")
    public ApiResponse<StudentSummary> studentSummary(@CurrentUser User user, @PathVariable String studentId) {
        return ApiResponse.of(fees.studentSummary(user, studentId));
    }

    @RequireRole(Role.ADMIN)
    @GetMapping("/overview")
    public ApiResponse<Overview> overview(@RequestParam(required = false) String className) {
        return ApiResponse.of(fees.overview(className));
    }

    // ---------------------------------------------------------------- payments

    @GetMapping("/payments")
    public ApiResponse<List<FeePayment>> payments(
            @CurrentUser User user,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.of(fees.payments(user, studentId, from, to));
    }

    @GetMapping("/payments/{id}")
    public ApiResponse<FeePayment> payment(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.of(fees.payment(user, id));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FeePayment> collect(@CurrentUser User user, @Valid @RequestBody PaymentRequest request) {
        return ApiResponse.success("Payment recorded", fees.collect(user, request));
    }

    // ---------------------------------------------------------------- concessions

    @GetMapping("/concessions")
    public ApiResponse<List<Concession>> concessions(@CurrentUser User user,
                                                     @RequestParam(required = false) String studentId) {
        return ApiResponse.of(fees.concessions(user, studentId));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/concessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Concession> grant(@CurrentUser User user, @Valid @RequestBody ConcessionRequest request) {
        return ApiResponse.success("Concession granted", fees.grant(user, request));
    }
}
