package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.FeeDtos.AssignRequest;
import com.ssa.schoolerp.dto.FeeDtos.ConcessionRequest;
import com.ssa.schoolerp.dto.FeeDtos.DueView;
import com.ssa.schoolerp.dto.FeeDtos.Overview;
import com.ssa.schoolerp.dto.FeeDtos.PaymentRequest;
import com.ssa.schoolerp.dto.FeeDtos.StudentSummary;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Concession;
import com.ssa.schoolerp.model.DiscountType;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.FeeHead;
import com.ssa.schoolerp.model.FeePayment;
import com.ssa.schoolerp.model.ReferenceData;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;

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
public class FeeService {

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;

    public FeeService(DataStore store, AccessGuard guard, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- fee heads

    public List<FeeHead> heads() {
        return store.feeHeads.stream().sorted(Comparator.comparing(FeeHead::dueDate)).toList();
    }

    /** Creates the fee head and bills every student of its classes. */
    public synchronized FeeHead createHead(FeeHead request) {
        validateHead(request);
        FeeHead head = new FeeHead(store.nextId("FH"), request.title(), request.amount(), request.frequency(),
                request.dueDate(), academicYearOr(request.academicYear()), List.copyOf(request.classNames()));
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
                academicYearOr(request.academicYear()), List.copyOf(request.classNames()));
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
        Set<String> visible = guard.readableStudentIds(user);
        Map<String, Student> students = studentsById();
        return store.feeDues.stream()
                .filter(d -> visible.contains(d.studentId()))
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
        store.feeDues.save(due.withPaid(due.paid() + request.amount()));
        Student student = store.students.getById(due.studentId());
        LocalDateTime now = LocalDateTime.now(clock);
        FeePayment payment = new FeePayment(store.nextId("PAY"), store.nextId("RCP-" + now.getYear()), student.id(),
                student.name(), student.className(), due.id(), due.title(), request.amount(), request.paymentMode(),
                now, request.remarks(), collector.getName());
        return store.payments.save(payment);
    }

    public List<FeePayment> payments(User user, String studentId, LocalDate from, LocalDate to) {
        if (studentId != null) {
            guard.checkStudentAccess(user, studentId);
        }
        Set<String> visible = guard.readableStudentIds(user);
        return store.payments.stream()
                .filter(p -> visible.contains(p.studentId()))
                .filter(p -> studentId == null || p.studentId().equals(studentId))
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

    public List<Concession> concessions(User user, String studentId) {
        if (studentId != null) {
            guard.checkStudentAccess(user, studentId);
        }
        Set<String> visible = guard.readableStudentIds(user);
        return store.concessions.findWhere(c -> visible.contains(c.studentId())
                && (studentId == null || c.studentId().equals(studentId)));
    }

    // ---------------------------------------------------------------- summaries

    public StudentSummary studentSummary(User user, String studentId) {
        Student student = guard.checkStudentAccess(user, studentId);
        Map<String, Student> students = Map.of(student.id(), student);
        List<DueView> dues = store.feeDues.stream()
                .filter(d -> d.studentId().equals(studentId))
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

    private static String academicYearOr(String academicYear) {
        return academicYear == null || academicYear.isBlank() ? ReferenceData.ACADEMIC_YEAR : academicYear;
    }
}
