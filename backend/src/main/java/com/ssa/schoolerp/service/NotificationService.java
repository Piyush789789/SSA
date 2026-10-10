package com.ssa.schoolerp.service;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.Notification;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.PushToken;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.model.UserAccount;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.service.notify.PushSender;
import com.ssa.schoolerp.service.notify.TextMessenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * In-app notifications, phone push notifications and (for important family alerts) SMS/WhatsApp.
 * Recipients are identified like {@link User#actorId()}: profile id for teachers/students/parents, account id for admins.
 */
@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public static final String ATTENDANCE = "ATTENDANCE";
    public static final String FEES = "FEES";
    public static final String FEE_REMINDER = "FEE_REMINDER";
    public static final String RESULTS = "RESULTS";
    public static final String HOMEWORK = "HOMEWORK";
    public static final String NOTICE = "NOTICE";
    public static final String MESSAGE = "MESSAGE";

    private final DataStore store;
    private final SettingsService settings;
    private final PushSender push;
    private final TextMessenger text;
    private final Clock clock;

    public NotificationService(DataStore store, SettingsService settings, PushSender push, TextMessenger text,
                               Clock clock) {
        this.store = store;
        this.settings = settings;
        this.push = push;
        this.text = text;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- sending

    /** In-app + push to the given people. */
    public void notify(Collection<String> recipientIds, String title, String body, String category, String link) {
        Set<String> recipients = new LinkedHashSet<>(recipientIds);
        recipients.remove(null);
        if (recipients.isEmpty()) return;
        LocalDateTime now = LocalDateTime.now(clock);
        List<Notification> rows = recipients.stream()
                .map(r -> new Notification(UUID.randomUUID().toString(), r, title, body, category, link, now, null))
                .toList();
        store.notifications.insertAll(rows);
        List<String> tokens = store.pushTokens.where("e.recipientId in ?1", recipients).stream().map(PushToken::id).toList();
        afterCommit(() -> push.send(tokens, title, body, link));
    }

    /** The student and their parents; with {@code sms} also a text message to the family's phone numbers. */
    public void notifyFamily(Student student, String title, String body, String category, String link, boolean sms) {
        List<Parent> parents = parentsOf(student.id());
        List<String> recipients = new ArrayList<>();
        recipients.add(student.id());
        parents.forEach(p -> recipients.add(p.id()));
        notify(recipients, title, body, category, link);
        if (sms) {
            Set<String> phones = new LinkedHashSet<>();
            parents.forEach(p -> phones.add(p.phone()));
            if (student.guardian() != null) phones.add(student.guardian().phone());
            phones.remove(null);
            String message = settings.get().schoolName() + ": " + body;
            afterCommit(() -> phones.forEach(phone -> text.send(phone, message)));
        }
    }

    /** Every current student of the classes and their parents. */
    public void notifyClassFamilies(Collection<String> classNames, String title, String body, String category, String link) {
        List<String> recipients = new ArrayList<>();
        for (String className : classNames) {
            for (Student s : store.studentsOf(className)) {
                recipients.add(s.id());
                parentsOf(s.id()).forEach(p -> recipients.add(p.id()));
            }
        }
        notify(recipients, title, body, category, link);
    }

    public void notifyAdmins(String title, String body, String category, String link) {
        notify(store.accounts.where("e.role = ?1 and e.active = true", Role.ADMIN).stream().map(UserAccount::id).toList(),
                title, body, category, link);
    }

    /** Everyone of the given roles (for notices). */
    public void notifyRoles(Collection<Role> roles, String title, String body, String category, String link) {
        List<String> recipients = new ArrayList<>();
        if (roles.contains(Role.STUDENT)) store.students.where(Student.ACTIVE_CONDITION).forEach(s -> recipients.add(s.id()));
        if (roles.contains(Role.PARENT)) store.parents.stream().forEach(p -> recipients.add(p.id()));
        if (roles.contains(Role.TEACHER)) store.teachers.stream().map(Teacher::id).forEach(recipients::add);
        if (roles.contains(Role.ADMIN)) store.accounts.where("e.role = ?1", Role.ADMIN).forEach(a -> recipients.add(a.id()));
        notify(recipients, title, body, category, link);
    }

    public List<Parent> parentsOf(String studentId) {
        return store.parents.where("?1 member of e.childIds", studentId);
    }

    // ---------------------------------------------------------------- inbox

    public List<Notification> inbox(User user, int limit) {
        return store.notifications.whereLimited(Math.min(Math.max(limit, 1), 200),
                "e.recipientId = ?1 order by e.createdAt desc", user.actorId());
    }

    public long unreadCount(User user) {
        return (Long) store.notifications.aggregate(
                "select count(e) from %s e where e.recipientId = ?1 and e.readAt is null", user.actorId()).get(0)[0];
    }

    public void markRead(User user, String id) {
        Notification n = store.notifications.getById(id);
        if (!n.recipientId().equals(user.actorId())) {
            throw ApiErrors.forbidden();
        }
        if (n.readAt() == null) store.notifications.save(n.markedRead(LocalDateTime.now(clock)));
    }

    public void markAllRead(User user) {
        LocalDateTime now = LocalDateTime.now(clock);
        store.notifications.where("e.recipientId = ?1 and e.readAt is null", user.actorId())
                .forEach(n -> store.notifications.save(n.markedRead(now)));
    }

    /** A phone registers its Expo push token after signing in. */
    public void registerPushToken(User user, String token, String platform) {
        if (token == null || !token.startsWith("ExponentPushToken[")) {
            throw ApiErrors.badRequest("Not an Expo push token");
        }
        store.pushTokens.save(new PushToken(token, user.actorId(), user.getId(), platform, LocalDateTime.now(clock)));
    }

    public void removePushToken(String token) {
        if (token != null) store.pushTokens.deleteById(token);
    }

    // ---------------------------------------------------------------- scheduled fee reminders

    /**
     * Every morning: families with a fee due in 3 days, or overdue by 1, 7 or 15 days, get one reminder each
     * (in-app, push and SMS/WhatsApp). A family is reminded at most once per day.
     */
    @Scheduled(cron = "${app.notify.fee-reminder-cron:0 0 9 * * *}", zone = "${app.timezone:Asia/Kolkata}")
    public void sendFeeReminders() {
        try {
            int sent = feeReminders(LocalDate.now(clock));
            if (sent > 0) log.info("Fee reminders sent to {} families", sent);
        } catch (RuntimeException e) {
            log.error("Fee reminders failed", e);
        }
    }

    public int feeReminders(LocalDate today) {
        List<LocalDate> days = List.of(today.plusDays(3), today.minusDays(1), today.minusDays(7), today.minusDays(15));
        List<FeeDue> dues = store.feeDues.where("e.paid + e.concession < e.amount and e.dueDate in ?1", days);
        Map<String, List<FeeDue>> byStudent = dues.stream().collect(Collectors.groupingBy(FeeDue::studentId));
        LocalDateTime startOfDay = today.atStartOfDay();
        int sent = 0;
        for (Map.Entry<String, List<FeeDue>> entry : byStudent.entrySet()) {
            Student student = store.students.findById(entry.getKey()).orElse(null);
            if (student == null || !student.isActive()) continue;
            boolean alreadyToday = !store.notifications.whereLimited(1,
                    "e.recipientId = ?1 and e.category = ?2 and e.createdAt >= ?3",
                    student.id(), FEE_REMINDER, startOfDay).isEmpty();
            if (alreadyToday) continue;
            long pending = entry.getValue().stream().mapToLong(FeeDue::pending).sum();
            FeeDue first = entry.getValue().get(0);
            String when = first.dueDate().isAfter(today) ? "is due on " + first.dueDate() : "was due on " + first.dueDate();
            String body = "Fee of Rs " + pending + " for " + student.name() + " (" + first.title() + ") " + when
                    + ". Please pay at the office or through the app.";
            notifyFamily(student, "Fee reminder", body, FEE_REMINDER, "/fees", true);
            sent++;
        }
        return sent;
    }

    // ---------------------------------------------------------------- helpers

    /** Runs after the current transaction commits (so nothing is sent for a change that was rolled back). */
    private static void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }
}
