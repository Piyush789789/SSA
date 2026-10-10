package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.AccountDtos.CreateAccountRequest;
import com.ssa.schoolerp.dto.AccountDtos.ParentRequest;
import com.ssa.schoolerp.dto.AccountDtos.TemporaryPassword;
import com.ssa.schoolerp.dto.CampusDtos.AdmitRequest;
import com.ssa.schoolerp.dto.CampusDtos.AdmitResult;
import com.ssa.schoolerp.dto.CampusDtos.EnquiryStats;
import com.ssa.schoolerp.dto.CampusDtos.EnquiryUpdate;
import com.ssa.schoolerp.dto.OperationsDtos.CreatedLogin;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.AdmissionEnquiry;
import com.ssa.schoolerp.model.Guardian;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** The admissions pipeline: enquiries from the website form or the front office, through to admission. */
@Service
@Transactional
public class AdmissionService {

    private final DataStore store;
    private final Clock clock;
    private final SchoolService school;
    private final AccountService accounts;
    private final NotificationService notifications;

    public AdmissionService(DataStore store, Clock clock, SchoolService school, AccountService accounts,
                            NotificationService notifications) {
        this.store = store;
        this.clock = clock;
        this.school = school;
        this.accounts = accounts;
        this.notifications = notifications;
    }

    /** From the public website form (source "Website") or entered by the office. */
    public AdmissionEnquiry create(AdmissionEnquiry request, boolean fromWebsite) {
        LocalDateTime now = LocalDateTime.now(clock);
        AdmissionEnquiry enquiry = request.withSystemFields(store.nextId("ENQ"), AdmissionEnquiry.NEW, now, now, null);
        if (fromWebsite) {
            enquiry = store.enquiries.save(enquiry.withSource("Website"));
        } else {
            enquiry = store.enquiries.save(enquiry);
        }
        notifications.notifyAdmins("New admission enquiry",
                enquiry.studentName() + " for class " + enquiry.classSought() + " — " + enquiry.parentName() + ", "
                        + enquiry.phone(), NotificationService.NOTICE, "/admissions");
        return enquiry;
    }

    public List<AdmissionEnquiry> list(String status, String query) {
        List<AdmissionEnquiry> all = status == null || status.isBlank()
                ? store.enquiries.where("1 = 1 order by e.createdAt desc")
                : store.enquiries.where("e.status = ?1 order by e.createdAt desc", status.trim().toUpperCase(Locale.ROOT));
        if (query == null || query.isBlank()) return all;
        String q = query.trim().toLowerCase(Locale.ROOT);
        return all.stream()
                .filter(e -> e.studentName().toLowerCase(Locale.ROOT).contains(q)
                        || e.parentName().toLowerCase(Locale.ROOT).contains(q)
                        || e.phone().contains(q))
                .toList();
    }

    /** Edits the details (whole enquiry) keeping its id, status history and dates. */
    public AdmissionEnquiry edit(String id, AdmissionEnquiry request) {
        AdmissionEnquiry existing = store.enquiries.getById(id);
        return store.enquiries.save(request.withSystemFields(id, request.status() != null ? request.status()
                : existing.status(), existing.createdAt(), LocalDateTime.now(clock), existing.admittedStudentId()));
    }

    /** Moves an enquiry along the pipeline, with a follow-up date and notes. */
    public AdmissionEnquiry update(String id, EnquiryUpdate update) {
        AdmissionEnquiry existing = store.enquiries.getById(id);
        if (AdmissionEnquiry.ADMITTED.equals(update.status()) && existing.admittedStudentId() == null) {
            throw ApiErrors.badRequest("Use \"Admit\" to create the student");
        }
        AdmissionEnquiry next = existing.withSystemFields(id, update.status(), existing.createdAt(),
                LocalDateTime.now(clock), existing.admittedStudentId());
        return store.enquiries.save(next.withFollowUp(update.followUpDate(), update.notes()));
    }

    public void delete(String id) {
        store.enquiries.getById(id);
        store.enquiries.deleteById(id);
    }

    /** Creates the student (and parent) from the enquiry and marks it admitted. */
    public AdmitResult admit(String id, AdmitRequest request) {
        AdmissionEnquiry enquiry = store.enquiries.getById(id);
        if (enquiry.admittedStudentId() != null) {
            throw ApiErrors.conflict("Already admitted as " + enquiry.admittedStudentId());
        }
        Guardian guardian = new Guardian(enquiry.parentName(), request.guardianRelation(), enquiry.phone(),
                enquiry.email());
        Student student = school.createStudent(new Student(null, enquiry.studentName(), request.className(),
                request.rollNumber(), enquiry.gender(), enquiry.dateOfBirth(), null, null, enquiry.address(),
                LocalDate.now(clock), guardian));
        // A sibling's parent already on record (same phone) gets the new child added instead of a duplicate parent.
        Parent sibling = store.parents.where("e.phone = ?1", enquiry.phone()).stream().findFirst().orElse(null);
        Parent parent;
        if (sibling != null) {
            List<String> children = new ArrayList<>(sibling.childIds());
            children.add(student.id());
            parent = accounts.updateParent(sibling.id(), new ParentRequest(sibling.name(), sibling.email(),
                    sibling.phone(), sibling.relation(), children));
        } else {
            parent = accounts.createParent(new ParentRequest(enquiry.parentName(), enquiry.email(), enquiry.phone(),
                    request.guardianRelation(), List.of(student.id())));
        }

        List<CreatedLogin> logins = new ArrayList<>();
        if (request.createLogins()) {
            TemporaryPassword s = accounts.create(new CreateAccountRequest(Role.STUDENT, student.id(), student.id()));
            logins.add(new CreatedLogin(student.name(), s.account().loginId(), s.temporaryPassword()));
            if (sibling == null) {
                TemporaryPassword p = accounts.create(new CreateAccountRequest(Role.PARENT, parent.id(), parent.id()));
                logins.add(new CreatedLogin(parent.name() + " (parent)", p.account().loginId(), p.temporaryPassword()));
            }
        }
        AdmissionEnquiry admitted = store.enquiries.save(enquiry.withSystemFields(id, AdmissionEnquiry.ADMITTED,
                enquiry.createdAt(), LocalDateTime.now(clock), student.id()));
        return new AdmitResult(admitted, student.id(), logins);
    }

    public EnquiryStats stats() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (String status : AdmissionEnquiry.STATUSES.split("\\|")) byStatus.put(status, 0L);
        for (Object[] row : store.enquiries.aggregate("select e.status, count(e) from %s e group by e.status")) {
            byStatus.put((String) row[0], (Long) row[1]);
        }
        LocalDate today = LocalDate.now(clock);
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        long newThisMonth = store.enquiries.where("e.createdAt >= ?1", monthStart).size();
        long admittedThisMonth = store.enquiries.where("e.status = ?1 and e.updatedAt >= ?2",
                AdmissionEnquiry.ADMITTED, monthStart).size();
        long followUps = store.enquiries.where("e.followUpDate <= ?1 and e.status not in ?2", today,
                List.of(AdmissionEnquiry.ADMITTED, AdmissionEnquiry.CLOSED)).size();
        return new EnquiryStats(byStatus, newThisMonth, admittedThisMonth, followUps);
    }
}
