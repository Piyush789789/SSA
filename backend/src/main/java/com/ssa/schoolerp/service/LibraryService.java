package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.CampusDtos.IssueRequest;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Book;
import com.ssa.schoolerp.model.BookIssue;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/** The school library: catalogue, issue/return with late fines, and each reader's loans. */
@Service
@Transactional
public class LibraryService {

    public static final int DEFAULT_LOAN_DAYS = 14;
    public static final int MAX_OPEN_LOANS = 3;
    /** Rupees per day late. */
    public static final long FINE_PER_DAY = 2;

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;
    private final NotificationService notifications;

    public LibraryService(DataStore store, AccessGuard guard, Clock clock, NotificationService notifications) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.notifications = notifications;
    }

    public List<Book> books(String query) {
        List<Book> all = store.books.findAll();
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return all.stream()
                .filter(b -> q.isEmpty() || contains(b.title(), q) || contains(b.author(), q) || contains(b.isbn(), q)
                        || contains(b.category(), q))
                .sorted(Comparator.comparing(Book::title))
                .toList();
    }

    public Book create(Book request) {
        return store.books.save(new Book(store.nextId("BK"), request.title().trim(), request.author(), request.isbn(),
                request.category(), request.shelf(), request.copies(), request.copies()));
    }

    /** Changing the number of copies keeps the books currently out on loan out. */
    public Book update(String id, Book request) {
        Book existing = store.books.getById(id);
        int out = existing.copies() - existing.available();
        if (request.copies() < out) {
            throw ApiErrors.badRequest(out + " copies are on loan; the library cannot own fewer than that");
        }
        return store.books.save(new Book(id, request.title().trim(), request.author(), request.isbn(),
                request.category(), request.shelf(), request.copies(), request.copies() - out));
    }

    public void delete(String id) {
        Book book = store.books.getById(id);
        if (book.available() < book.copies()) {
            throw ApiErrors.conflict("Some copies are still on loan");
        }
        store.books.deleteById(id);
    }

    /** Lends a copy to a student or teacher (by their id). */
    public BookIssue issue(User user, IssueRequest request) {
        Book book = store.books.getById(request.bookId());
        if (book.available() <= 0) {
            throw ApiErrors.conflict("All copies of \"" + book.title() + "\" are on loan");
        }
        String name;
        String type;
        String className = null;
        Student student = store.students.findById(request.borrowerId()).orElse(null);
        if (student != null) {
            if (!student.isActive()) throw ApiErrors.badRequest(student.name() + " has left the school");
            name = student.name();
            type = "STUDENT";
            className = student.className();
        } else {
            Teacher teacher = store.teachers.findById(request.borrowerId())
                    .orElseThrow(() -> ApiErrors.notFound("Student or teacher", request.borrowerId()));
            name = teacher.name();
            type = "TEACHER";
        }
        List<BookIssue> open = openLoans(request.borrowerId());
        if (open.size() >= MAX_OPEN_LOANS) {
            throw ApiErrors.conflict(name + " already has " + open.size() + " books; return one first");
        }
        if (open.stream().anyMatch(i -> i.bookId().equals(book.id()))) {
            throw ApiErrors.conflict(name + " already has this book");
        }
        LocalDate today = LocalDate.now(clock);
        int days = request.days() != null ? request.days() : DEFAULT_LOAN_DAYS;
        store.books.save(book.withAvailable(book.available() - 1));
        return store.bookIssues.save(new BookIssue(store.nextId("ISS"), book.id(), book.title(), request.borrowerId(),
                name, type, className, today, today.plusDays(days), null, 0, user.getName()));
    }

    public BookIssue returnBook(String issueId) {
        BookIssue issue = store.bookIssues.getById(issueId);
        if (issue.returnedOn() != null) {
            throw ApiErrors.conflict("Already returned on " + issue.returnedOn());
        }
        LocalDate today = LocalDate.now(clock);
        long late = Math.max(0, ChronoUnit.DAYS.between(issue.dueOn(), today));
        store.books.findById(issue.bookId()).ifPresent(b -> store.books.save(b.withAvailable(b.available() + 1)));
        return store.bookIssues.save(issue.returned(today, late * FINE_PER_DAY));
    }

    public BookIssue renew(String issueId) {
        BookIssue issue = store.bookIssues.getById(issueId);
        if (issue.returnedOn() != null) {
            throw ApiErrors.conflict("This book was returned");
        }
        LocalDate from = issue.dueOn().isAfter(LocalDate.now(clock)) ? issue.dueOn() : LocalDate.now(clock);
        return store.bookIssues.save(issue.renewed(from.plusDays(DEFAULT_LOAN_DAYS)));
    }

    /** {@code status}: open (default), overdue, returned or all. */
    public List<BookIssue> loans(String status, String borrowerId) {
        String s = status == null ? "open" : status.toLowerCase(Locale.ROOT);
        List<Object> params = new java.util.ArrayList<>();
        String condition = switch (s) {
            case "overdue" -> {
                params.add(LocalDate.now(clock));
                yield "e.returnedOn is null and e.dueOn < ?1";
            }
            case "returned" -> "e.returnedOn is not null";
            case "all" -> "1 = 1";
            default -> "e.returnedOn is null";
        };
        if (borrowerId != null && !borrowerId.isBlank()) {
            params.add(borrowerId);
            condition += " and e.borrowerId = ?" + params.size();
        }
        return store.bookIssues.whereLimited(500, condition + " order by e.issuedOn desc", params.toArray());
    }

    /** The reader's own loans: a student's or teacher's, or a parent's children's. */
    public List<BookIssue> myLoans(User user, String studentId) {
        String borrower;
        if (user.getRole() == Role.TEACHER) {
            borrower = user.getProfileId();
        } else if (user.getRole() == Role.ADMIN) {
            throw ApiErrors.badRequest("Use the library loans list");
        } else {
            borrower = studentId != null ? studentId : user.getProfileId();
            guard.checkStudentAccess(user, borrower);
        }
        return store.bookIssues.where("e.borrowerId = ?1 order by e.issuedOn desc", borrower);
    }

    /** Reminds borrowers whose books are overdue (run by the librarian). Returns how many were reminded. */
    public int remindOverdue() {
        LocalDate today = LocalDate.now(clock);
        int count = 0;
        for (BookIssue issue : store.bookIssues.where("e.returnedOn is null and e.dueOn < ?1", today)) {
            String body = "\"" + issue.bookTitle() + "\" was due on " + issue.dueOn() + ". Fine: Rs "
                    + FINE_PER_DAY + " per day late.";
            Student student = store.students.findById(issue.borrowerId()).orElse(null);
            if (student != null) {
                notifications.notifyFamily(student, "Library book overdue", body, NotificationService.NOTICE,
                        "/library", false);
            } else {
                notifications.notify(List.of(issue.borrowerId()), "Library book overdue", body,
                        NotificationService.NOTICE, "/library");
            }
            count++;
        }
        return count;
    }

    private List<BookIssue> openLoans(String borrowerId) {
        return store.bookIssues.where("e.borrowerId = ?1 and e.returnedOn is null", borrowerId);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }
}
