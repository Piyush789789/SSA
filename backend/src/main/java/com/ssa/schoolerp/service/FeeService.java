package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.FeeDtos.AssignRequest;
import com.ssa.schoolerp.dto.FeeDtos.ConcessionRequest;
import com.ssa.schoolerp.dto.FeeDtos.DepositRequest;
import com.ssa.schoolerp.dto.FeeDtos.DueView;
import com.ssa.schoolerp.dto.FeeDtos.Overview;
import com.ssa.schoolerp.dto.FeeDtos.PaymentRequest;
import com.ssa.schoolerp.dto.FeeDtos.StudentSummary;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Concession;
import com.ssa.schoolerp.model.DiscountType;
import com.ssa.schoolerp.model.FeeDeposit;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.FeeHead;
import com.ssa.schoolerp.model.FeePayment;
import com.ssa.schoolerp.model.ReferenceData;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class FeeService {

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;
    private final NotificationService notifications;
    private final SettingsService settings;

    public FeeService(DataStore store, AccessGuard guard, Clock clock, SettingsService settings, NotificationService notifications) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.notifications = notifications;
        this.settings = settings;
    }

    // ---------------------------------------------------------------- fee heads

    public List<FeeHead> heads() {
        return store.feeHeads.stream().sorted(Comparator.comparing(FeeHead::dueDate)).toList();
    }

    /** Creates the fee head and bills every student of its classes. */
    public synchronized FeeHead createHead(FeeHead request) {
        validateHead(request);
        FeeHead head = new FeeHead(store.nextId("FH"), request.title(), request.amount(), request.frequency(),
                request.dueDate(), settings.yearOr(request.academicYear()), List.copyOf(request.classNames()));
        store.feeHeads.save(head);
        billStudentsOf(head);
        return head;
    }

    public synchronized FeeHead updateHead(String id, FeeHead request) {
        FeeHead existing = store.feeHeads.getById(id);
        validateHead(request);
        List<FeeDue> dues = store.feeDues.findWhere(d -> d.feeHeadId().equals(id));
        boolean collected = dues.stream().anyMatch(d -> d.paid() > 0);
        if (collected && request.amount() != existing.amount()) {
            throw ApiErrors.conflict("The amount cannot change after payments have been collected for this fee");
        }

        Set<String> removedClasses = new HashSet<>(existing.classNames());
        removedClasses.removeAll(request.classNames());
        Map<String, Student> students = studentsById();
        List<FeeDue> removedDues = dues.stream()
                .filter(d -> removedClasses.contains(classOf(students, d.studentId())))
                .toList();
        if (removedDues.stream().anyMatch(d -> d.paid() > 0)) {
            throw ApiErrors.conflict("Payments exist for students of a class being removed from this fee");
        }
        removedDues.forEach(d -> deleteDue(d.id()));

        FeeHead head = new FeeHead(id, request.title(), request.amount(), request.frequency(), request.dueDate(),
                settings.yearOr(request.academicYear()), List.copyOf(request.classNames()));
        store.feeHeads.save(head);
        store.feeDues.findWhere(d -> d.feeHeadId().equals(id))
                .forEach(d -> store.feeDues.save(d.withHeadDetails(head.title(), head.amount(), head.dueDate())));
        billStudentsOf(head);
        return head;
    }

    public synchronized void deleteHead(String id) {
        store.feeHeads.getById(id);
        List<FeeDue> dues = store.feeDues.findWhere(d -> d.feeHeadId().equals(id));
        if (dues.stream().anyMatch(d -> d.paid() > 0)) {
            throw ApiErrors.conflict("Payments have been collected for this fee; it cannot be deleted");
        }
        dues.forEach(d -> deleteDue(d.id()));
        store.feeHeads.deleteById(id);
    }

    private void validateHead(FeeHead head) {
        if (!ReferenceData.FEE_FREQUENCIES.contains(head.frequency())) {
            throw ApiErrors.badRequest("Unknown frequency: " + head.frequency());
        }
        head.classNames().forEach(store.classes::getById);
    }

    private void billStudentsOf(FeeHead head) {
        store.students.stream()
                .filter(s -> head.classNames().contains(s.className()))
                .filter(s -> !store.feeDues.existsById(FeeDue.idFor(s.id(), head.id())))
                .forEach(s -> store.feeDues.save(newDue(s, head)));
    }

    private void deleteDue(String dueId) {
        store.concessions.deleteWhere(c -> c.feeDueId().equals(dueId));
        store.feeDues.deleteById(dueId);
    }

    /** Bills fees for a student who joined after the fee heads were created (new admissions). */
    public synchronized void billNewStudent(Student student) {
        store.feeHeads.stream()
                .filter(h -> h.classNames().contains(student.className()))
                .forEach(h -> store.feeDues.save(newDue(student, h)));
    }

    private static FeeDue newDue(Student student, FeeHead head) {
        return new FeeDue(FeeDue.idFor(student.id(), head.id()), student.id(), head.id(), head.title(), head.amount(),
                0, 0, head.dueDate());
    }

    // ---------------------------------------------------------------- dues

    public List<DueView> dues(User user, String studentId, String className, String status) {
        if (studentId != null) {
            guard.checkStudentAccess(user, studentId);
        }
        if (className != null) {
            guard.checkClassAccess(user, className);
        }
        Map<String, Student> students = studentsById();
        List<FeeDue> rows;
        if (studentId != null) {
            rows = store.feeDues.where("e.studentId = ?1", studentId); // access already checked
        } else {
            Set<String> visible = guard.readableStudentIds(user);
            rows = store.feeDues.findWhere(d -> visible.contains(d.studentId()));
        }
        return rows.stream()
                .filter(d -> studentId == null || d.studentId().equals(studentId))
                .filter(d -> className == null || className.equals(classOf(students, d.studentId())))
                .map(d -> view(d, students))
                .filter(v -> status == null || v.status().equalsIgnoreCase(status))
                .sorted(Comparator.comparing(DueView::dueDate).thenComparing(DueView::studentId))
                .toList();
    }

    public synchronized DueView assign(AssignRequest request) {
        Student student = store.students.getById(request.studentId());
        FeeHead head = store.feeHeads.getById(request.feeHeadId());
        if (store.feeDues.existsById(FeeDue.idFor(student.id(), head.id()))) {
            throw ApiErrors.conflict(student.name() + " is already billed for " + head.title());
        }
        return view(store.feeDues.save(newDue(student, head)), studentsById());
    }

    // ---------------------------------------------------------------- payments

    public synchronized FeePayment collect(User collector, PaymentRequest request) {
        if (!ReferenceData.PAYMENT_MODES.contains(request.paymentMode())) {
            throw ApiErrors.badRequest("Unknown payment mode: " + request.paymentMode());
        }
        FeeDue due = store.feeDues.getById(request.feeDueId());
        if (request.amount() > due.pending()) {
            throw ApiErrors.badRequest("Amount exceeds the pending balance of ₹" + due.pending());
        }
        FeePayment payment = recordPayment(due, request.amount(), request.paymentMode(), request.remarks(), collector.getName());
        notifyPaid(payment);
        return payment;
    }

    /** A verified online (Razorpay) payment: recorded with a receipt and the family is told. */
    public synchronized FeePayment recordOnlinePayment(String feeDueId, long amount, String gatewayPaymentId) {
        FeeDue due = store.feeDues.getById(feeDueId);
        FeePayment payment = recordPayment(due, amount, "Online", "Razorpay " + gatewayPaymentId, "Online payment");
        notifyPaid(payment);
        return payment;
    }

    /** What can still be paid on a due: pending minus deposits awaiting verification. */
    public long payableNow(FeeDue due) {
        return Math.max(0, due.pending() - pendingDepositTotal(due.id()));
    }

    private FeePayment recordPayment(FeeDue due, long amount, String mode, String remarks, String collectedBy) {
        store.feeDues.save(due.withPaid(due.paid() + amount));
        Student student = store.students.getById(due.studentId());
        LocalDateTime now = LocalDateTime.now(clock);
        FeePayment payment = new FeePayment(store.nextId("PAY"), store.nextId("RCP-" + now.getYear()), student.id(),
                student.name(), student.className(), due.id(), due.title(), amount, mode, now, remarks, collectedBy);
        return store.payments.save(payment);
    }

    // ---------------------------------------------------------------- deposits reported by families

    /** A student or parent reports a payment made outside the office; it waits for an admin to verify it. */
    public synchronized FeeDeposit submitDeposit(User user, DepositRequest request) {
        FeeDue due = store.feeDues.getById(request.feeDueId());
        Student student = guard.checkStudentAccess(user, due.studentId());
        if (!ReferenceData.DEPOSIT_MODES.contains(request.paymentMode())) {
            throw ApiErrors.badRequest("Payment mode must be one of " + ReferenceData.DEPOSIT_MODES);
        }
        String reference = request.referenceNo() == null ? "" : request.referenceNo().trim();
        if (reference.isEmpty()) {
            throw ApiErrors.badRequest("Enter the transaction / cheque reference number");
        }
        if (request.paidOn().isAfter(LocalDate.now(clock))) {
            throw ApiErrors.badRequest("The payment date cannot be in the future");
        }
        boolean referenceUsed = store.deposits.stream()
                .anyMatch(d -> d.status() != FeeDeposit.Status.REJECTED && reference.equalsIgnoreCase(d.referenceNo()));
        if (referenceUsed) {
            throw ApiErrors.conflict("A deposit with reference " + reference + " was already submitted");
        }
        long available = due.pending() - pendingDepositTotal(due.id());
        if (request.amount() > available) {
            throw ApiErrors.badRequest("Amount exceeds what is still owed (₹" + Math.max(0, available)
                    + " after deposits awaiting verification)");
        }
        FeeDeposit deposit = new FeeDeposit(store.nextId("DEP"), student.id(), student.name(), student.className(),
                due.id(), due.title(), request.amount(), request.paymentMode(), reference, request.paidOn(),
                request.note(), FeeDeposit.Status.PENDING, user.getName(), LocalDateTime.now(clock), null, null, null,
                null);
        FeeDeposit saved = store.deposits.save(deposit);
        notifications.notifyAdmins("Fee deposit to verify", student.name() + " (" + student.className() + ") reported ₹"
                + request.amount() + " by " + request.paymentMode() + ", ref " + reference + ".", NotificationService.FEES, "/fees");
        return saved;
    }

    public List<FeeDeposit> deposits(User user, String studentId, FeeDeposit.Status status) {
        if (studentId != null) {
            guard.checkStudentAccess(user, studentId);
        }
        Set<String> visible = guard.readableStudentIds(user);
        return store.deposits.stream()
                .filter(d -> visible.contains(d.studentId()))
                .filter(d -> studentId == null || d.studentId().equals(studentId))
                .filter(d -> status == null || d.status() == status)
                .sorted(Comparator.comparing(FeeDeposit::submittedAt).reversed())
                .toList();
    }

    /** Admin confirms the money arrived: records the payment (with a receipt) and closes the deposit. */
    public synchronized FeeDeposit approveDeposit(User admin, String id, String note) {
        FeeDeposit deposit = pendingDeposit(id);
        FeeDue due = store.feeDues.getById(deposit.feeDueId());
        if (deposit.amount() > due.pending()) {
            throw ApiErrors.conflict("Only ₹" + due.pending() + " is still owed on this fee; reject this deposit instead");
        }
        String remarks = "App deposit " + deposit.referenceNo() + " paid on " + deposit.paidOn();
        FeePayment payment = recordPayment(due, deposit.amount(), deposit.paymentMode(), remarks, admin.getName());
        notifyPaid(payment);
        return store.deposits.save(deposit.reviewed(FeeDeposit.Status.APPROVED, admin.getName(),
                LocalDateTime.now(clock), note, payment.id()));
    }

    public synchronized FeeDeposit rejectDeposit(User admin, String id, String note) {
        FeeDeposit deposit = pendingDeposit(id);
        store.students.findById(deposit.studentId()).ifPresent(student -> notifications.notifyFamily(student,
                "Deposit not verified", "The ₹" + deposit.amount() + " deposit (ref " + deposit.referenceNo()
                        + ") could not be verified" + (note == null || note.isBlank() ? "." : ": " + note),
                NotificationService.FEES, "/fees", false));
        return store.deposits.save(deposit.reviewed(FeeDeposit.Status.REJECTED, admin.getName(),
                LocalDateTime.now(clock), note, null));
    }

    private void notifyPaid(FeePayment payment) {
        store.students.findById(payment.studentId()).ifPresent(student -> notifications.notifyFamily(student,
                "Payment received", "₹" + payment.amount() + " received for " + payment.feeTitle() + ". Receipt "
                        + payment.receiptNo() + ".", NotificationService.FEES, "/fees", false));
    }

    private FeeDeposit pendingDeposit(String id) {
        FeeDeposit deposit = store.deposits.getById(id);
        if (deposit.status() != FeeDeposit.Status.PENDING) {
            throw ApiErrors.conflict("This deposit was already " + deposit.status().name().toLowerCase());
        }
        return deposit;
    }

    private long pendingDepositTotal(String dueId) {
        return store.deposits.where("e.feeDueId = ?1 and e.status = ?2", dueId, FeeDeposit.Status.PENDING).stream()
                .mapToLong(FeeDeposit::amount)
                .sum();
    }

    public List<FeePayment> payments(User user, String studentId, LocalDate from, LocalDate to) {
        if (studentId != null) {
            guard.checkStudentAccess(user, studentId);
        }
        List<FeePayment> rows;
        if (studentId != null) {
            rows = store.payments.where("e.studentId = ?1", studentId); // access already checked
        } else {
            Set<String> visible = guard.readableStudentIds(user);
            rows = store.payments.findWhere(p -> visible.contains(p.studentId()));
        }
        return rows.stream()
                .filter(p -> from == null || !p.paidAt().toLocalDate().isBefore(from))
                .filter(p -> to == null || !p.paidAt().toLocalDate().isAfter(to))
                .sorted(Comparator.comparing(FeePayment::paidAt).reversed())
                .toList();
    }

    public FeePayment payment(User user, String id) {
        FeePayment payment = store.payments.getById(id);
        guard.checkStudentAccess(user, payment.studentId());
        return payment;
    }

    // ---------------------------------------------------------------- concessions

    /** Grants a concession, which lowers what the student owes on that due. */
    public synchronized Concession grant(User approver, ConcessionRequest request) {
        if (!ReferenceData.CONCESSION_TYPES.contains(request.type())) {
            throw ApiErrors.badRequest("Unknown concession type: " + request.type());
        }
        if (request.discountType() == DiscountType.PERCENTAGE && request.discountValue() > 100) {
            throw ApiErrors.badRequest("A percentage concession cannot exceed 100");
        }
        FeeDue due = store.feeDues.getById(request.feeDueId());
        long discount = request.discountType() == DiscountType.PERCENTAGE
                ? Math.round(due.amount() * request.discountValue() / 100.0)
                : Math.round(request.discountValue());
        if (discount > due.pending()) {
            throw ApiErrors.badRequest("Concession of ₹" + discount + " exceeds the pending balance of ₹" + due.pending());
        }
        store.feeDues.save(due.withConcession(due.concession() + discount));
        Concession concession = new Concession(store.nextId("CON"), due.studentId(), due.id(), due.title(),
                request.type(), request.discountType(), request.discountValue(), discount, request.description(),
                approver.getName(), LocalDate.now(clock));
        return store.concessions.save(concession);
    }

    /** Withdraws a concession; the student owes that amount again. */
    public synchronized void deleteConcession(String id) {
        Concession concession = store.concessions.getById(id);
        store.feeDues.findById(concession.feeDueId()).ifPresent(due ->
                store.feeDues.save(due.withConcession(Math.max(0, due.concession() - concession.discountAmount()))));
        store.concessions.deleteById(id);
    }

    public List<Concession> concessions(User user, String studentId) {
        if (studentId != null) {
            guard.checkStudentAccess(user, studentId);
        }
        if (studentId != null) {
            return store.concessions.where("e.studentId = ?1", studentId); // access already checked
        }
        Set<String> visible = guard.readableStudentIds(user);
        return store.concessions.findWhere(c -> visible.contains(c.studentId()));
    }

    // ---------------------------------------------------------------- summaries

    public StudentSummary studentSummary(User user, String studentId) {
        Student student = guard.checkStudentAccess(user, studentId);
        Map<String, Student> students = Map.of(student.id(), student);
        List<DueView> dues = store.feeDues.where("e.studentId = ?1", studentId).stream()
                .map(d -> view(d, students))
                .sorted(Comparator.comparing(DueView::dueDate))
                .toList();
        return new StudentSummary(student.id(), student.name(), student.className(),
                dues.stream().mapToLong(DueView::amount).sum(),
                dues.stream().mapToLong(DueView::concession).sum(),
                dues.stream().mapToLong(DueView::paid).sum(),
                dues.stream().mapToLong(DueView::pending).sum(),
                dues.stream().filter(d -> "Overdue".equals(d.status())).mapToLong(DueView::pending).sum(),
                dues);
    }

    /** School-wide (or one class's) fee position. */
    public Overview overview(String className) {
        if (className != null) {
            store.classes.getById(className);
        }
        Map<String, Student> students = studentsById();
        List<DueView> dues = store.feeDues.stream()
                .filter(d -> className == null || className.equals(classOf(students, d.studentId())))
                .map(d -> view(d, students))
                .toList();
        LocalDate today = LocalDate.now(clock);
        List<FeePayment> todays = store.payments.findWhere(p -> p.paidAt().toLocalDate().equals(today)
                && (className == null || className.equals(p.className())));
        Map<String, List<DueView>> byStudent = dues.stream().collect(Collectors.groupingBy(DueView::studentId));
        int fullyPaid = (int) byStudent.values().stream()
                .filter(list -> list.stream().allMatch(d -> d.pending() == 0))
                .count();
        return new Overview(className,
                dues.stream().mapToLong(DueView::amount).sum(),
                dues.stream().mapToLong(DueView::concession).sum(),
                dues.stream().mapToLong(DueView::paid).sum(),
                dues.stream().mapToLong(DueView::pending).sum(),
                dues.stream().filter(d -> "Overdue".equals(d.status())).mapToLong(DueView::pending).sum(),
                todays.stream().mapToLong(FeePayment::amount).sum(),
                todays.size(),
                fullyPaid,
                byStudent.size() - fullyPaid);
    }

    // ---------------------------------------------------------------- helpers

    private DueView view(FeeDue due, Map<String, Student> students) {
        Student student = students.get(due.studentId());
        return new DueView(due.id(), due.studentId(), student == null ? null : student.name(),
                student == null ? null : student.className(), due.feeHeadId(), due.title(), due.amount(),
                due.concession(), due.paid(), due.pending(), due.dueDate(), statusOf(due));
    }

    private String statusOf(FeeDue due) {
        if (due.pending() == 0) {
            return "Paid";
        }
        if (due.dueDate().isBefore(LocalDate.now(clock))) {
            return "Overdue";
        }
        return due.paid() > 0 ? "Partial" : "Pending";
    }

    private Map<String, Student> studentsById() {
        return store.students.stream().collect(Collectors.toMap(Student::id, Function.identity()));
    }

    private static String classOf(Map<String, Student> students, String studentId) {
        Student student = students.get(studentId);
        return student == null ? null : student.className();
    }

}
