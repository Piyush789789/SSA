package com.ssa.schoolerp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;

/** A book lent to a student or teacher. Open while {@code returnedOn} is null. */
@Entity
@Table(indexes = @Index(name = "idx_issue_borrower", columnList = "borrowerId"))
@JsonFields
public class BookIssue implements Identifiable {

    @Id
    private String id;

    private String bookId;
    private String bookTitle;
    private String borrowerId;
    private String borrowerName;
    /** STUDENT or TEACHER. */
    private String borrowerType;
    private String className;
    private LocalDate issuedOn;
    private LocalDate dueOn;
    private LocalDate returnedOn;
    /** Late fine in rupees, set on return. */
    private long fine;
    private String issuedBy;

    protected BookIssue() {
    }

    public BookIssue(String id, String bookId, String bookTitle, String borrowerId, String borrowerName,
                     String borrowerType, String className, LocalDate issuedOn, LocalDate dueOn, LocalDate returnedOn,
                     long fine, String issuedBy) {
        this.id = id;
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.borrowerId = borrowerId;
        this.borrowerName = borrowerName;
        this.borrowerType = borrowerType;
        this.className = className;
        this.issuedOn = issuedOn;
        this.dueOn = dueOn;
        this.returnedOn = returnedOn;
        this.fine = fine;
        this.issuedBy = issuedBy;
    }

    public BookIssue returned(LocalDate on, long lateFine) {
        return new BookIssue(id, bookId, bookTitle, borrowerId, borrowerName, borrowerType, className, issuedOn, dueOn,
                on, lateFine, issuedBy);
    }

    public BookIssue renewed(LocalDate newDue) {
        return new BookIssue(id, bookId, bookTitle, borrowerId, borrowerName, borrowerType, className, issuedOn, newDue,
                returnedOn, fine, issuedBy);
    }

    @Override
    public String id() {
        return id;
    }

    public String bookId() {
        return bookId;
    }

    public String bookTitle() {
        return bookTitle;
    }

    public String borrowerId() {
        return borrowerId;
    }

    public String borrowerName() {
        return borrowerName;
    }

    public LocalDate dueOn() {
        return dueOn;
    }

    public LocalDate returnedOn() {
        return returnedOn;
    }

    public long fine() {
        return fine;
    }
}
