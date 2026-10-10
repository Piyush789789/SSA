package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.dto.CampusDtos.AdmitRequest;
import com.ssa.schoolerp.dto.CampusDtos.AdmitResult;
import com.ssa.schoolerp.dto.CampusDtos.AlbumRequest;
import com.ssa.schoolerp.dto.CampusDtos.AssignTransport;
import com.ssa.schoolerp.dto.CampusDtos.AtRiskStudent;
import com.ssa.schoolerp.dto.CampusDtos.EnquiryStats;
import com.ssa.schoolerp.dto.CampusDtos.EnquiryUpdate;
import com.ssa.schoolerp.dto.CampusDtos.FeeReminderRun;
import com.ssa.schoolerp.dto.CampusDtos.IdCards;
import com.ssa.schoolerp.dto.CampusDtos.IssueRequest;
import com.ssa.schoolerp.dto.CampusDtos.PhotoRequest;
import com.ssa.schoolerp.dto.CampusDtos.PhotosRequest;
import com.ssa.schoolerp.dto.CampusDtos.PtmBooking;
import com.ssa.schoolerp.dto.CampusDtos.PtmSlotsRequest;
import com.ssa.schoolerp.dto.CampusDtos.RouteView;
import com.ssa.schoolerp.dto.CampusDtos.StudentTransport;
import com.ssa.schoolerp.dto.CampusDtos.VisitRequest;
import com.ssa.schoolerp.model.AdmissionEnquiry;
import com.ssa.schoolerp.model.Album;
import com.ssa.schoolerp.model.Book;
import com.ssa.schoolerp.model.BookIssue;
import com.ssa.schoolerp.model.HealthProfile;
import com.ssa.schoolerp.model.HealthVisit;
import com.ssa.schoolerp.model.PtmSlot;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.TransportAssignment;
import com.ssa.schoolerp.model.TransportRoute;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.security.PublicEndpoint;
import com.ssa.schoolerp.security.RequireRole;
import com.ssa.schoolerp.service.AdmissionService;
import com.ssa.schoolerp.service.CampusService;
import com.ssa.schoolerp.service.InsightService;
import com.ssa.schoolerp.service.LibraryService;
import com.ssa.schoolerp.service.NotificationService;
import com.ssa.schoolerp.service.TransportService;
import jakarta.servlet.http.HttpServletRequest;
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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Admissions, transport, library, ID cards, PTM, gallery, health, at-risk students and fee reminders. */
@RestController
@RequestMapping("/api")
public class CampusController {

    /** Website enquiry form: at most this many per IP address per hour (stops spam bots flooding the office). */
    private static final int PUBLIC_ENQUIRIES_PER_HOUR = 5;

    private final AdmissionService admissions;
    private final TransportService transport;
    private final LibraryService library;
    private final CampusService campus;
    private final InsightService insights;
    private final NotificationService notifications;
    private final Clock clock;
    private final Map<String, Deque<Instant>> enquiriesByIp = new ConcurrentHashMap<>();

    public CampusController(AdmissionService admissions, TransportService transport, LibraryService library,
                            CampusService campus, InsightService insights, NotificationService notifications,
                            Clock clock) {
        this.admissions = admissions;
        this.transport = transport;
        this.library = library;
        this.campus = campus;
        this.insights = insights;
        this.notifications = notifications;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- admissions

    /** The admission enquiry form on the school's public website (no login). */
    @PublicEndpoint
    @PostMapping("/enquiries/public")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, String>> publicEnquiry(@Valid @RequestBody AdmissionEnquiry request,
                                                          HttpServletRequest http) {
        checkRate(http.getRemoteAddr());
        AdmissionEnquiry saved = admissions.create(request, true);
        return ApiResponse.success("Thank you! The school office will call you soon.", Map.of("id", saved.id()));
    }

    @RequireRole(Role.ADMIN)
    @GetMapping("/enquiries")
    public ApiResponse<List<AdmissionEnquiry>> enquiries(@RequestParam(required = false) String status,
                                                         @RequestParam(required = false) String q) {
        return ApiResponse.of(admissions.list(status, q));
    }

    @RequireRole(Role.ADMIN)
    @GetMapping("/enquiries/stats")
    public ApiResponse<EnquiryStats> enquiryStats() {
        return ApiResponse.of(admissions.stats());
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/enquiries")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AdmissionEnquiry> createEnquiry(@Valid @RequestBody AdmissionEnquiry request) {
        return ApiResponse.success("Enquiry added", admissions.create(request, false));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/enquiries/{id}")
    public ApiResponse<AdmissionEnquiry> editEnquiry(@PathVariable String id, @Valid @RequestBody AdmissionEnquiry request) {
        return ApiResponse.success("Enquiry updated", admissions.edit(id, request));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/enquiries/{id}/status")
    public ApiResponse<AdmissionEnquiry> updateEnquiry(@PathVariable String id, @Valid @RequestBody EnquiryUpdate update) {
        return ApiResponse.success("Enquiry updated", admissions.update(id, update));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/enquiries/{id}/admit")
    public ApiResponse<AdmitResult> admit(@PathVariable String id, @Valid @RequestBody AdmitRequest request) {
        return ApiResponse.success("Student admitted", admissions.admit(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/enquiries/{id}")
    public ApiResponse<Void> deleteEnquiry(@PathVariable String id) {
        admissions.delete(id);
        return ApiResponse.success("Enquiry deleted");
    }

    private void checkRate(String ip) {
        Instant now = clock.instant();
        Deque<Instant> times = enquiriesByIp.computeIfAbsent(ip == null ? "?" : ip, k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst().isBefore(now.minusSeconds(3600))) times.pollFirst();
            if (times.size() >= PUBLIC_ENQUIRIES_PER_HOUR) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many enquiries from this connection; please call the school office");
            }
            times.addLast(now);
        }
    }

    // ---------------------------------------------------------------- transport

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/transport/routes")
    public ApiResponse<List<RouteView>> routes() {
        return ApiResponse.of(transport.routes());
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/transport/routes")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TransportRoute> createRoute(@Valid @RequestBody TransportRoute request) {
        return ApiResponse.success("Route added", transport.create(request));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/transport/routes/{id}")
    public ApiResponse<TransportRoute> updateRoute(@PathVariable String id, @Valid @RequestBody TransportRoute request) {
        return ApiResponse.success("Route updated", transport.update(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/transport/routes/{id}")
    public ApiResponse<Void> deleteRoute(@PathVariable String id) {
        transport.delete(id);
        return ApiResponse.success("Route deleted");
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/transport/assignments")
    public ApiResponse<TransportAssignment> assign(@Valid @RequestBody AssignTransport request) {
        return ApiResponse.success("Transport assigned", transport.assign(request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/transport/assignments/{studentId}")
    public ApiResponse<Void> unassign(@PathVariable String studentId) {
        transport.unassign(studentId);
        return ApiResponse.success("Removed from transport");
    }

    /** The student's bus, stop and driver; data is null when the student does not use school transport. */
    @GetMapping("/transport/students/{studentId}")
    public ApiResponse<StudentTransport> studentTransport(@CurrentUser User user, @PathVariable String studentId) {
        return ApiResponse.of(transport.forStudent(user, studentId));
    }

    // ---------------------------------------------------------------- library

    @GetMapping("/library/books")
    public ApiResponse<List<Book>> books(@RequestParam(required = false) String q) {
        return ApiResponse.of(library.books(q));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/library/books")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Book> createBook(@Valid @RequestBody Book request) {
        return ApiResponse.success("Book added", library.create(request));
    }

    @RequireRole(Role.ADMIN)
    @PutMapping("/library/books/{id}")
    public ApiResponse<Book> updateBook(@PathVariable String id, @Valid @RequestBody Book request) {
        return ApiResponse.success("Book updated", library.update(id, request));
    }

    @RequireRole(Role.ADMIN)
    @DeleteMapping("/library/books/{id}")
    public ApiResponse<Void> deleteBook(@PathVariable String id) {
        library.delete(id);
        return ApiResponse.success("Book removed");
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/library/issues")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookIssue> issue(@CurrentUser User user, @Valid @RequestBody IssueRequest request) {
        return ApiResponse.success("Book issued", library.issue(user, request));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/library/issues/{id}/return")
    public ApiResponse<BookIssue> returnBook(@PathVariable String id) {
        BookIssue issue = library.returnBook(id);
        return ApiResponse.success(issue.fine() > 0 ? "Returned late: fine Rs " + issue.fine() : "Book returned", issue);
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/library/issues/{id}/renew")
    public ApiResponse<BookIssue> renew(@PathVariable String id) {
        return ApiResponse.success("Loan renewed", library.renew(id));
    }

    /** {@code status}: open (default), overdue, returned, all. */
    @RequireRole(Role.ADMIN)
    @GetMapping("/library/issues")
    public ApiResponse<List<BookIssue>> loans(@RequestParam(required = false) String status,
                                              @RequestParam(required = false) String borrowerId) {
        return ApiResponse.of(library.loans(status, borrowerId));
    }

    @RequireRole(Role.ADMIN)
    @PostMapping("/library/remind-overdue")
    public ApiResponse<Map<String, Integer>> remindOverdue() {
        int count = library.remindOverdue();
        return ApiResponse.success(count + " readers reminded", Map.of("reminded", count));
    }

    /** The reader's own loans (parents pass studentId). */
    @RequireRole({Role.STUDENT, Role.PARENT, Role.TEACHER})
    @GetMapping("/library/my-loans")
    public ApiResponse<List<BookIssue>> myLoans(@CurrentUser User user, @RequestParam(required = false) String studentId) {
        return ApiResponse.of(library.myLoans(user, studentId));
    }

    // ---------------------------------------------------------------- ID cards

    @GetMapping("/id-cards")
    public ApiResponse<IdCards> idCards(@CurrentUser User user, @RequestParam(required = false) String className,
                                        @RequestParam(required = false) String studentId,
                                        @RequestParam(defaultValue = "false") boolean teachers) {
        return ApiResponse.of(campus.idCards(user, className, studentId, teachers));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PutMapping("/students/{studentId}/photo")
    public ApiResponse<Student> setPhoto(@CurrentUser User user, @PathVariable String studentId,
                                         @Valid @RequestBody PhotoRequest request) {
        return ApiResponse.success("Photo saved", campus.setPhoto(user, studentId, request.fileId()));
    }

    // ---------------------------------------------------------------- PTM

    @RequireRole({Role.ADMIN, Role.TEACHER, Role.PARENT})
    @GetMapping("/ptm/slots")
    public ApiResponse<List<PtmSlot>> ptmSlots(
            @CurrentUser User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from) {
        return ApiResponse.of(campus.slots(user, from));
    }

    @RequireRole(Role.TEACHER)
    @PostMapping("/ptm/slots")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<List<PtmSlot>> createPtmSlots(@CurrentUser User user, @Valid @RequestBody PtmSlotsRequest request) {
        List<PtmSlot> slots = campus.createSlots(user, request);
        return ApiResponse.success(slots.size() + " slots opened", slots);
    }

    @RequireRole(Role.PARENT)
    @PostMapping("/ptm/slots/{id}/book")
    public ApiResponse<PtmSlot> bookPtm(@CurrentUser User user, @PathVariable String id,
                                        @Valid @RequestBody PtmBooking booking) {
        return ApiResponse.success("Meeting booked", campus.book(user, id, booking));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER, Role.PARENT})
    @DeleteMapping("/ptm/slots/{id}/booking")
    public ApiResponse<PtmSlot> cancelPtm(@CurrentUser User user, @PathVariable String id) {
        return ApiResponse.success("Booking cancelled", campus.cancelBooking(user, id));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @DeleteMapping("/ptm/slots/{id}")
    public ApiResponse<Void> deletePtmSlot(@CurrentUser User user, @PathVariable String id) {
        campus.deleteSlot(user, id);
        return ApiResponse.success("Slot removed");
    }

    // ---------------------------------------------------------------- gallery

    @GetMapping("/events/albums")
    public ApiResponse<List<Album>> albums() {
        return ApiResponse.of(campus.albums());
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PostMapping("/events/albums")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Album> createAlbum(@CurrentUser User user, @Valid @RequestBody AlbumRequest request) {
        return ApiResponse.success("Album created", campus.createAlbum(user, request));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PostMapping("/events/albums/{id}/photos")
    public ApiResponse<Album> addPhotos(@CurrentUser User user, @PathVariable String id,
                                        @Valid @RequestBody PhotosRequest request) {
        return ApiResponse.success("Photos added", campus.addPhotos(user, id, request.photoIds()));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @DeleteMapping("/events/albums/{id}/photos/{photoId}")
    public ApiResponse<Album> removePhoto(@CurrentUser User user, @PathVariable String id, @PathVariable String photoId) {
        return ApiResponse.success("Photo removed", campus.removePhoto(user, id, photoId));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @DeleteMapping("/events/albums/{id}")
    public ApiResponse<Void> deleteAlbum(@CurrentUser User user, @PathVariable String id) {
        campus.deleteAlbum(user, id);
        return ApiResponse.success("Album deleted");
    }

    // ---------------------------------------------------------------- health

    @GetMapping("/health-records/{studentId}")
    public ApiResponse<HealthProfile> healthProfile(@CurrentUser User user, @PathVariable String studentId) {
        return ApiResponse.of(campus.healthProfile(user, studentId));
    }

    @PutMapping("/health-records/{studentId}")
    public ApiResponse<HealthProfile> saveHealthProfile(@CurrentUser User user, @PathVariable String studentId,
                                                        @Valid @RequestBody HealthProfile request) {
        return ApiResponse.success("Health record saved", campus.saveHealthProfile(user, studentId, request));
    }

    @GetMapping("/health-records/{studentId}/visits")
    public ApiResponse<List<HealthVisit>> visits(@CurrentUser User user, @PathVariable String studentId) {
        return ApiResponse.of(campus.visits(user, studentId));
    }

    @RequireRole({Role.ADMIN, Role.TEACHER})
    @PostMapping("/health-records/{studentId}/visits")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<HealthVisit> recordVisit(@CurrentUser User user, @PathVariable String studentId,
                                                @Valid @RequestBody VisitRequest request) {
        return ApiResponse.success("Visit recorded; the family has been told", campus.recordVisit(user, studentId, request));
    }

    // ---------------------------------------------------------------- insights & reminders

    /** Students who may need attention (admins: school or a class; teachers: their classes). */
    @RequireRole({Role.ADMIN, Role.TEACHER})
    @GetMapping("/insights/at-risk")
    public ApiResponse<List<AtRiskStudent>> atRisk(@CurrentUser User user,
                                                   @RequestParam(required = false) String className) {
        return ApiResponse.of(insights.atRisk(user, className));
    }

    /** Sends today's fee reminders now (they also go automatically at 9 AM). Families are reminded once a day. */
    @RequireRole(Role.ADMIN)
    @PostMapping("/fee-reminders/send")
    public ApiResponse<FeeReminderRun> sendFeeReminders() {
        int sent = notifications.feeReminders(LocalDate.now(clock));
        return ApiResponse.success(sent + " families reminded", new FeeReminderRun(LocalDateTime.now(clock), sent));
    }
}
