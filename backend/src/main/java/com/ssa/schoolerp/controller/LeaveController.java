package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.OperationsDtos.LeaveApplication;
import com.ssa.schoolerp.dto.OperationsDtos.LeaveDecision;
import com.ssa.schoolerp.model.LeaveRequest;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Leave applications: students and parents to the class teachers, teachers to the admins. */
@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaves;

    public LeaveController(LeaveService leaves) {
        this.leaves = leaves;
    }

    /** {@code status}: PENDING, APPROVED, REJECTED; {@code type}: STUDENT or STAFF. */
    @GetMapping
    public ApiResponse<List<LeaveRequest>> list(@CurrentUser User user,
                                                @RequestParam(required = false) String status,
                                                @RequestParam(required = false) String type) {
        return ApiResponse.of(leaves.list(user, status, type));
    }

    @RequireRole({Role.STUDENT, Role.PARENT, Role.TEACHER})
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<LeaveRequest> apply(@CurrentUser User user, @Valid @RequestBody LeaveApplication application) {
        return ApiResponse.success("Leave application sent", leaves.apply(user, application));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PostMapping("/{id}/decision")
    public ApiResponse<LeaveRequest> decide(@CurrentUser User user, @PathVariable String id,
                                            @Valid @RequestBody LeaveDecision decision) {
        LeaveRequest decided = leaves.decide(user, id, decision);
        return ApiResponse.success("Leave " + decided.status().toLowerCase(), decided);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancel(@CurrentUser User user, @PathVariable String id) {
        leaves.cancel(user, id);
        return ApiResponse.success("Leave application withdrawn");
    }
}
