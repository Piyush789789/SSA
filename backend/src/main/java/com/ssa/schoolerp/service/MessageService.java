package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.MessageRequest;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Message;
import com.ssa.schoolerp.model.RecipientType;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Who sees a message: its sender; admins; for CLASS messages every family of that class; for STUDENT
 * messages only that student and their parents; for TEACHER messages only that teacher.
 */
@Service
@Transactional
public class MessageService {

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;
    private final NotificationService notifications;

    public MessageService(DataStore store, AccessGuard guard, Clock clock, NotificationService notifications) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.notifications = notifications;
    }

    public List<Message> inbox(User user) {
        return store.messages.stream()
                .filter(visibleTo(user))
                .sorted(Comparator.comparing(Message::sentAt).reversed())
                .toList();
    }

    private Predicate<Message> visibleTo(User user) {
        String me = user.actorId();
        return switch (user.getRole()) {
            case ADMIN -> m -> true;
            case TEACHER -> m -> me.equals(m.senderId())
                    || (m.recipientType() == RecipientType.TEACHER && me.equals(m.recipientId()));
            case STUDENT -> {
                Set<String> classes = Set.of(guard.studentOf(user).className());
                yield m -> me.equals(m.senderId()) || isFamilyMessage(m, Set.of(me), classes);
            }
            case PARENT -> {
                List<Student> children = guard.childrenOf(user);
                Set<String> childIds = children.stream().map(Student::id).collect(Collectors.toSet());
                Set<String> classes = children.stream().map(Student::className).collect(Collectors.toSet());
                yield m -> me.equals(m.senderId()) || isFamilyMessage(m, childIds, classes);
            }
        };
    }

    private static boolean isFamilyMessage(Message m, Set<String> studentIds, Set<String> classes) {
        return (m.recipientType() == RecipientType.CLASS && classes.contains(m.className()))
                || (m.recipientType() == RecipientType.STUDENT && studentIds.contains(m.recipientId()));
    }

    public Message send(User user, MessageRequest request) {
        boolean family = user.getRole() == Role.STUDENT || user.getRole() == Role.PARENT;
        String className;
        String recipientName;
        switch (request.recipientType()) {
            case CLASS -> {
                if (family) {
                    throw ApiErrors.forbidden();
                }
                SchoolClass schoolClass = store.classes.getById(required(request.className(), "className"));
                guard.checkCanManageClass(user, schoolClass.id());
                className = schoolClass.id();
                recipientName = "Class " + className + " Parents";
            }
            case STUDENT -> {
                if (family) {
                    throw ApiErrors.forbidden();
                }
                Student student = store.students.getById(required(request.recipientId(), "recipientId"));
                guard.checkCanManageClass(user, student.className());
                className = student.className();
                recipientName = student.guardian() == null
                        ? student.name()
                        : student.name() + " (Parent: " + student.guardian().name() + ")";
            }
            case TEACHER -> {
                Teacher teacher = store.teachers.getById(required(request.recipientId(), "recipientId"));
                // Families can only write to teachers who teach their (or their child's) class.
                Set<String> sharedClasses = guard.readableClasses(user).stream()
                        .filter(teacher.assignedClasses()::contains)
                        .collect(Collectors.toSet());
                if (family && sharedClasses.isEmpty()) {
                    throw ApiErrors.forbidden();
                }
                className = sharedClasses.size() == 1 ? sharedClasses.iterator().next() : null;
                recipientName = teacher.name();
            }
            default -> throw ApiErrors.badRequest("Unknown recipient type");
        }

        Message message = new Message(store.nextId("MSG"), user.actorId(), user.getName(), user.getRole(),
                request.recipientType(), className, request.recipientId(), recipientName, request.subject(),
                request.body(), LocalDateTime.now(clock));
        Message saved = store.messages.save(message);
        String title = "Message from " + user.getName();
        switch (saved.recipientType()) {
            case CLASS -> notifications.notifyClassFamilies(List.of(saved.className()), title, saved.subject(),
                    NotificationService.MESSAGE, "/messages");
            case STUDENT -> store.students.findById(saved.recipientId()).ifPresent(s -> notifications.notifyFamily(s,
                    title, saved.subject(), NotificationService.MESSAGE, "/messages", false));
            case TEACHER -> notifications.notify(List.of(saved.recipientId()), title, saved.subject(),
                    NotificationService.MESSAGE, "/messages");
        }
        return saved;
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw ApiErrors.badRequest(field + " is required for this recipient type");
        }
        return value;
    }
}
