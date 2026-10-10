package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.ClassView;
import com.ssa.schoolerp.dto.ProfileDtos.ParentSelfUpdate;
import com.ssa.schoolerp.dto.ProfileDtos.StudentContactUpdate;
import com.ssa.schoolerp.dto.ProfileDtos.TeacherSelfUpdate;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.SchoolService;
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

/** Classes, students and teachers. Reads are scoped to what the caller may see; writes are admin-only. */
@RestController
@RequestMapping("/api")
public class SchoolController {

    private final SchoolService school;
    private final AccessGuard guard;
    private final DataStore store;

    public SchoolController(SchoolService school, AccessGuard guard, DataStore store) {
        this.school = school;
        this.guard = guard;
        this.store = store;
    }

    // ---------------------------------------------------------------- classes

    @GetMapping("/classes")
    public ApiResponse<List<ClassView>> classes(@CurrentUser User user) {
        return ApiResponse.of(school.classes(user));
    }

    @GetMapping("/classes/{id}")
    public ApiResponse<ClassView> classById(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.of(school.classView(user, id));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/classes/{id}/students")
    public ApiResponse<List<Student>> classStudents(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.of(school.students(user, id, null));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/classes")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ClassView> createClass(@Valid @RequestBody SchoolClass request) {
        return ApiResponse.success("Class created", school.createClass(request));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/classes/{id}")
    public ApiResponse<ClassView> updateClass(@PathVariable String id, @Valid @RequestBody SchoolClass request) {
        return ApiResponse.success("Class updated", school.updateClass(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/classes/{id}")
    public ApiResponse<Void> deleteClass(@PathVariable String id) {
        school.deleteClass(id);
        return ApiResponse.success("Class deleted");
    }

    // ---------------------------------------------------------------- students

    /** Admins see every student, teachers their classes, students themselves, parents their children. */
    @GetMapping("/students")
    public ApiResponse<List<Student>> students(@CurrentUser User user,
                                               @RequestParam(required = false) String className,
                                               @RequestParam(required = false) String q) {
        return ApiResponse.of(school.students(user, className, q));
    }

    @GetMapping("/students/{id}")
    public ApiResponse<Student> student(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.of(guard.checkStudentAccess(user, id));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/students")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Student> createStudent(@Valid @RequestBody Student request) {
        return ApiResponse.success("Student admitted", school.createStudent(request));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/students/{id}")
    public ApiResponse<Student> updateStudent(@PathVariable String id, @Valid @RequestBody Student request) {
        return ApiResponse.success("Student updated", school.updateStudent(id, request));
    }

    /** Address and guardian phone/email; the student, their parent or an admin may change them. */
    @RequireRole({Role.ADMIN, Role.STUDENT, Role.PARENT})
    @PutMapping("/students/{id}/contact")
    public ApiResponse<Student> updateStudentContact(@CurrentUser User user, @PathVariable String id,
                                                     @Valid @RequestBody StudentContactUpdate request) {
        return ApiResponse.success("Contact details updated", school.updateStudentContact(user, id, request));
    }

    // ---------------------------------------------------------------- own profile

    @RequireRole(Role.TEACHER)
    @PutMapping("/me/teacher-profile")
    public ApiResponse<Teacher> updateOwnTeacherProfile(@CurrentUser User user,
                                                        @Valid @RequestBody TeacherSelfUpdate request) {
        return ApiResponse.success("Profile updated", school.updateOwnTeacherProfile(user, request));
    }

    @RequireRole(Role.PARENT)
    @PutMapping("/me/parent-profile")
    public ApiResponse<Parent> updateOwnParentProfile(@CurrentUser User user,
                                                      @Valid @RequestBody ParentSelfUpdate request) {
        return ApiResponse.success("Profile updated", school.updateOwnParentProfile(user, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/students/{id}")
    public ApiResponse<Void> deleteStudent(@PathVariable String id) {
        school.deleteStudent(id);
        return ApiResponse.success("Student deleted");
    }

    // ---------------------------------------------------------------- teachers

    @GetMapping("/teachers")
    public ApiResponse<List<Teacher>> teachers() {
        return ApiResponse.of(school.teachers());
    }

    @GetMapping("/teachers/{id}")
    public ApiResponse<Teacher> teacher(@PathVariable String id) {
        return ApiResponse.of(store.teachers.getById(id));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/teachers")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Teacher> createTeacher(@Valid @RequestBody Teacher request) {
        return ApiResponse.success("Teacher added", school.createTeacher(request));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/teachers/{id}")
    public ApiResponse<Teacher> updateTeacher(@PathVariable String id, @Valid @RequestBody Teacher request) {
        return ApiResponse.success("Teacher updated", school.updateTeacher(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/teachers/{id}")
    public ApiResponse<Void> deleteTeacher(@PathVariable String id) {
        school.deleteTeacher(id);
        return ApiResponse.success("Teacher deleted");
    }
}
