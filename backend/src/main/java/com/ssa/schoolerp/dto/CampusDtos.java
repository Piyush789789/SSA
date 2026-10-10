package com.ssa.schoolerp.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ssa.schoolerp.model.AdmissionEnquiry;
import com.ssa.schoolerp.model.SchoolSettings;
import com.ssa.schoolerp.model.TransportAssignment;
import com.ssa.schoolerp.model.TransportRoute;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/** Requests and views for admissions, transport, library, ID cards, PTM, gallery, health and insights. */
public final class CampusDtos {

    private CampusDtos() {
    }

    // ---------------------------------------------------------------- admissions

    public record EnquiryUpdate(@NotBlank @Pattern(regexp = AdmissionEnquiry.STATUSES) String status,
                                LocalDate followUpDate, @Size(max = 2000) String notes) {
    }

    /** Turns an enquiry into a student of {@code className}. */
    public record AdmitRequest(@NotBlank String className, Integer rollNumber, @Size(max = 30) String guardianRelation,
                               boolean createLogins) {
    }

    public record AdmitResult(AdmissionEnquiry enquiry, String studentId, List<OperationsDtos.CreatedLogin> logins) {
    }

    /** Count per pipeline status, plus this month's new enquiries and admissions. */
    public record EnquiryStats(Map<String, Long> byStatus, long newThisMonth, long admittedThisMonth,
                               long followUpsDue) {
    }

    // ---------------------------------------------------------------- transport

    public record AssignTransport(@NotBlank String studentId, @NotBlank String routeId, @NotBlank String stopName) {
    }

    public record RouteView(TransportRoute route, int students, List<TransportAssignment> riders) {
    }

    public record StudentTransport(TransportAssignment assignment, TransportRoute route, TransportRoute.Stop stop) {
    }

    // ---------------------------------------------------------------- library

    public record IssueRequest(@NotBlank String bookId, @NotBlank String borrowerId,
                               @Min(1) @Max(60) Integer days) {
    }

    // ---------------------------------------------------------------- ID cards

    public record IdCard(String id, String name, String role, String className, Integer rollNumber,
                         LocalDate dateOfBirth, String bloodGroup, String guardianName, String phone, String address,
                         String photoFileId, String transportRoute, String transportStop) {
    }

    public record IdCards(SchoolSettings school, String academicYear, LocalDate validTill, List<IdCard> cards) {
    }

    public record PhotoRequest(@NotBlank String fileId) {
    }

    // ---------------------------------------------------------------- PTM

    public record PtmSlotsRequest(
            @NotBlank @Size(max = 80) String title,
            @NotNull LocalDate date,
            @NotNull @JsonFormat(pattern = "HH:mm") LocalTime from,
            @NotNull @JsonFormat(pattern = "HH:mm") LocalTime to,
            @Min(5) @Max(60) int minutes,
            @Size(max = 200) String location) {
    }

    public record PtmBooking(@NotBlank String studentId, @Size(max = 500) String note) {
    }

    // ---------------------------------------------------------------- gallery

    public record AlbumRequest(@NotBlank @Size(max = 120) String title, @NotNull LocalDate eventDate,
                               @Size(max = 2000) String description, List<String> photoIds) {
    }

    public record PhotosRequest(@NotEmpty List<String> photoIds) {
    }

    // ---------------------------------------------------------------- health

    public record VisitRequest(@NotBlank @Size(max = 1000) String complaint, @Size(max = 1000) String actionTaken,
                               boolean sentHome) {
    }

    // ---------------------------------------------------------------- insights

    /** A student who may need help, with a score (higher = more urgent) and the reasons. */
    public record AtRiskStudent(String studentId, String name, String className, Integer rollNumber, int score,
                                List<String> reasons, Double attendanceRate, Double averageMarks, long overdueFees,
                                int missingHomework) {
    }

    public record FeeReminderRun(LocalDateTime at, int familiesReminded) {
    }
}
