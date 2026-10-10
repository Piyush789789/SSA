package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.MessageRequest;
import com.ssa.schoolerp.model.Homework;
import com.ssa.schoolerp.model.Message;
import com.ssa.schoolerp.model.Notice;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.StudyMaterial;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.ClassContentService;
import com.ssa.schoolerp.service.MessageService;
import com.ssa.schoolerp.service.NoticeService;
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

/** Notices, messages, homework and study materials. */
@RestController
@RequestMapping("/api")
public class CommunicationController {

    private final NoticeService notices;
    private final MessageService messages;
    private final ClassContentService content;

    public CommunicationController(NoticeService notices, MessageService messages, ClassContentService content) {
        this.notices = notices;
        this.messages = messages;
        this.content = content;
    }

    // ---------------------------------------------------------------- notices

    @GetMapping("/notices")
    public ApiResponse<List<Notice>> notices(@CurrentUser User user) {
        return ApiResponse.of(notices.visibleTo(user));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PostMapping("/notices")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Notice> createNotice(@CurrentUser User user, @Valid @RequestBody Notice request) {
        return ApiResponse.success("Notice published", notices.create(user, request));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PutMapping("/notices/{id}")
    public ApiResponse<Notice> updateNotice(@CurrentUser User user, @PathVariable String id,
                                            @Valid @RequestBody Notice request) {
        return ApiResponse.success("Notice updated", notices.update(user, id, request));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @DeleteMapping("/notices/{id}")
    public ApiResponse<Void> deleteNotice(@CurrentUser User user, @PathVariable String id) {
        notices.delete(user, id);
        return ApiResponse.success("Notice deleted");
    }

    // ---------------------------------------------------------------- messages

    @GetMapping("/messages")
    public ApiResponse<List<Message>> inbox(@CurrentUser User user) {
        return ApiResponse.of(messages.inbox(user));
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Message> send(@CurrentUser User user, @Valid @RequestBody MessageRequest request) {
        return ApiResponse.success("Message sent", messages.send(user, request));
    }

    // ---------------------------------------------------------------- homework

    @GetMapping("/homework")
    public ApiResponse<List<Homework>> homework(@CurrentUser User user,
                                                @RequestParam(required = false) String className,
                                                @RequestParam(required = false) String subject) {
        return ApiResponse.of(content.homework(user, className, subject));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PostMapping("/homework")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Homework> createHomework(@CurrentUser User user, @Valid @RequestBody Homework request) {
        return ApiResponse.success("Homework assigned", content.createHomework(user, request));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PutMapping("/homework/{id}")
    public ApiResponse<Homework> updateHomework(@CurrentUser User user, @PathVariable String id,
                                                @Valid @RequestBody Homework request) {
        return ApiResponse.success("Homework updated", content.updateHomework(user, id, request));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @DeleteMapping("/homework/{id}")
    public ApiResponse<Void> deleteHomework(@CurrentUser User user, @PathVariable String id) {
        content.deleteHomework(user, id);
        return ApiResponse.success("Homework deleted");
    }

    // ---------------------------------------------------------------- study materials

    @GetMapping("/study-materials")
    public ApiResponse<List<StudyMaterial>> materials(@CurrentUser User user,
                                                      @RequestParam(required = false) String className,
                                                      @RequestParam(required = false) String subject,
                                                      @RequestParam(required = false) String category) {
        return ApiResponse.of(content.materials(user, className, subject, category));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PostMapping("/study-materials")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<StudyMaterial> createMaterial(@CurrentUser User user,
                                                     @Valid @RequestBody StudyMaterial request) {
        return ApiResponse.success("Study material uploaded", content.createMaterial(user, request));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @DeleteMapping("/study-materials/{id}")
    public ApiResponse<Void> deleteMaterial(@CurrentUser User user, @PathVariable String id) {
        content.deleteMaterial(user, id);
        return ApiResponse.success("Study material deleted");
    }
}
