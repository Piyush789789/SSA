package com.ssa.schoolerp;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssa.schoolerp.model.AttendanceRecord;
import com.ssa.schoolerp.model.AttendanceStatus;
import com.ssa.schoolerp.model.LeaveRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Holidays, leave, staff attendance, substitutions, staff roles, homework submissions, seating and import. */
class StaffAndLeaveTest extends ApiTestSupport {

    private static final String ROHIT = "STU-2026-0503";  // demo student, 5-B
    private static final String ANANYA = "STU-2026-0512"; // demo parent's child, 5-B
    private static final String ANJALI = "TCH-2026-001";  // demo teacher: 5-B and 6-A
    private static final String TABASSUM = "TCH-2026-005";

    private LocalDate today() {
        return LocalDate.now(ZoneId.of("Asia/Kolkata"));
    }

    private LocalDate schoolDay() {
        LocalDate today = today();
        return today.getDayOfWeek() == DayOfWeek.SUNDAY ? today.minusDays(1) : today;
    }

    private LocalDate nextMonday() {
        return today().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
    }

    // ---------------------------------------------------------------- calendar

    @Test
    void attendanceIsNotTakenOnAHoliday() throws Exception {
        String admin = admin();
        LocalDate day = schoolDay();
        postAs(admin, "/api/calendar", Map.of("title", "Rain holiday", "startDate", day.toString(), "type", "HOLIDAY"))
                .andExpect(status().isCreated());
        getAs(student(), "/api/calendar/check?date=" + day).andExpect(jsonPath("$.data.holiday").value(true));
        putAs(teacher(), "/api/attendance", Map.of("className", "5-B", "date", day.toString(),
                "entries", List.of(Map.of("studentId", ROHIT, "status", "present")))).andExpect(status().isBadRequest());
        postAs(teacher(), "/api/calendar", Map.of("title", "x", "startDate", day.toString()))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- leave

    @Test
    void approvedStudentLeaveMarksAttendance() throws Exception {
        LocalDate from = nextMonday().plusDays(7);
        LocalDate to = from.plusDays(1);
        JsonNode leave = data(postAs(parent(), "/api/leaves", Map.of("studentId", ANANYA, "fromDate", from.toString(),
                "toDate", to.toString(), "reason", "Fever")).andExpect(status().isCreated()));
        String id = leave.get("id").asText();
        postAs(parent(), "/api/leaves", Map.of("studentId", ANANYA, "fromDate", to.toString(),
                "toDate", to.toString(), "reason", "Again")).andExpect(status().isConflict());
        postAs(parent(), "/api/leaves", Map.of("studentId", ROHIT, "fromDate", from.toString(),
                "toDate", to.toString(), "reason", "Not my child")).andExpect(status().isForbidden());

        getAs(teacher(), "/api/leaves?status=PENDING").andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')]").exists());
        postAs(student(), "/api/leaves/" + id + "/decision", Map.of("approve", true)).andExpect(status().isForbidden());
        postAs(teacher(), "/api/leaves/" + id + "/decision", Map.of("approve", true, "note", "Get well soon"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        AttendanceRecord record = store.attendance.getById(AttendanceRecord.idFor(ANANYA, from));
        assertThat(record.status()).isEqualTo(AttendanceStatus.LEAVE);
        postAs(teacher(), "/api/leaves/" + id + "/decision", Map.of("approve", false)).andExpect(status().isConflict());
    }

    @Test
    void teachersApplyForLeaveAndOnlyAdminsDecide() throws Exception {
        LocalDate day = nextMonday().plusDays(14);
        String id = data(postAs(teacher(), "/api/leaves", Map.of("fromDate", day.toString(), "toDate", day.toString(),
                "reason", "Wedding")).andExpect(status().isCreated())).get("id").asText();
        postAs(teacher(), "/api/leaves/" + id + "/decision", Map.of("approve", true)).andExpect(status().isForbidden());
        postAs(admin(), "/api/leaves/" + id + "/decision", Map.of("approve", true)).andExpect(status().isOk());
        assertThat(store.staffAttendance.getById(ANJALI + "|" + day).status()).isEqualTo("LEAVE");
    }

    // ---------------------------------------------------------------- staff attendance & substitutions

    @Test
    void officeMarksStaffAttendance() throws Exception {
        String admin = admin();
        LocalDate day = schoolDay();
        JsonNode sheet = data(getAs(admin, "/api/staff-attendance?date=" + day).andExpect(status().isOk()));
        assertThat(sheet).hasSize(8);
        putAs(admin, "/api/staff-attendance", Map.of("date", day.toString(), "entries", List.of(
                Map.of("teacherId", ANJALI, "status", "PRESENT", "checkIn", "07:45")))).andExpect(status().isOk());
        getAs(teacher(), "/api/staff-attendance/records").andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].checkIn").value("07:45"));
        getAs(teacher(), "/api/staff-attendance").andExpect(status().isForbidden());
        getAs(admin, "/api/staff-attendance/report").andExpect(status().isOk());
    }

    @Test
    void absentTeachersPeriodsCanBeCovered() throws Exception {
        LocalDate monday = nextMonday();
        store.leaves.save(new LeaveRequest("LV-T1", LeaveRequest.STAFF, ANJALI, "Anjali Singh", null, monday, monday,
                "Sick", LeaveRequest.APPROVED, ANJALI, "Anjali Singh", monday.minusDays(1).atStartOfDay(), "Principal",
                monday.minusDays(1).atStartOfDay(), null));
        String admin = admin();
        JsonNode needs = data(getAs(admin, "/api/substitutions/needs?date=" + monday).andExpect(status().isOk()));
        assertThat(needs).hasSize(3); // 5-B P1, 6-A P2, 5-B P4

        putAs(admin, "/api/substitutions", Map.of("date", monday.toString(), "className", "5-B",
                "periodId", "period-1", "substituteTeacherId", TABASSUM)).andExpect(status().isOk());
        putAs(admin, "/api/substitutions", Map.of("date", monday.toString(), "className", "6-A",
                "periodId", "period-2", "substituteTeacherId", TABASSUM)).andExpect(status().isConflict());
        putAs(admin, "/api/substitutions", Map.of("date", monday.toString(), "className", "5-B",
                "periodId", "period-4", "substituteTeacherId", ANJALI)).andExpect(status().isBadRequest());

        JsonNode day = data(getAs(admin, "/api/timetable/teacher-day?teacherId=" + TABASSUM + "&date=" + monday));
        assertThat(day.findValuesAsText("substitution")).contains("true");
        JsonNode own = data(getAs(teacher(), "/api/timetable/teacher-day?date=" + monday));
        assertThat(own).hasSize(2); // period 1 is covered by Tabassum
    }

    // ---------------------------------------------------------------- staff roles

    @Test
    void anAccountantCanChangeFeesButNothingElse() throws Exception {
        String admin = admin();
        JsonNode created = data(postAs(admin, "/api/accounts/staff", Map.of("name", "Ravi Accountant",
                "loginId", "ravi@ssa.edu", "staffTitle", "Accountant", "permissions", List.of("FEES")))
                .andExpect(status().isCreated()));
        String token = login("ravi@ssa.edu", created.get("temporaryPassword").asText(), "ADMIN");
        getAs(token, "/api/fees/dues").andExpect(status().isOk());
        getAs(token, "/api/students").andExpect(status().isOk());
        postAs(token, "/api/notices", Map.of("title", "Hi", "description", "x", "audience", "ALL"))
                .andExpect(status().isForbidden());
        getAs(token, "/api/accounts").andExpect(status().isForbidden());
        getAs(token, "/api/auth/me").andExpect(jsonPath("$.user.permissions[0]").value("FEES"));
        getAs(admin, "/api/accounts/permissions").andExpect(status().isOk());
    }

    // ---------------------------------------------------------------- homework submissions

    @Test
    void studentsSubmitHomeworkPhotosAndTeachersReviewThem() throws Exception {
        String student = student();
        JsonNode homework = data(getAs(student, "/api/homework"));
        String homeworkId = homework.get(0).get("id").asText();

        MockMultipartFile photo = new MockMultipartFile("file", "page1.jpg", "image/jpeg", new byte[]{1, 2, 3});
        String body = mockMvc.perform(multipart("/api/files").file(photo).header("Authorization", "Bearer " + student))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String fileId = objectMapper.readTree(body).get("data").get("id").asText();
        MockMultipartFile exe = new MockMultipartFile("file", "x.exe", "application/octet-stream", new byte[]{1});
        mockMvc.perform(multipart("/api/files").file(exe).header("Authorization", "Bearer " + student))
                .andExpect(status().isBadRequest());

        putAs(student, "/api/homework/" + homeworkId + "/submission", Map.of("text", "Done", "fileIds", List.of(fileId)))
                .andExpect(status().isOk());
        getAs(teacher(), "/api/files/" + fileId).andExpect(status().isOk());

        JsonNode sheet = data(getAs(teacher(), "/api/homework/" + homeworkId + "/submissions").andExpect(status().isOk()));
        String submissionId = null;
        for (JsonNode row : sheet) {
            if (row.get("studentId").asText().equals(ROHIT)) submissionId = row.get("submission").get("id").asText();
        }
        assertThat(submissionId).isNotNull();
        postAs(teacher(), "/api/homework-submissions/" + submissionId + "/review",
                Map.of("status", "REVIEWED", "grade", "A", "feedback", "Neat work")).andExpect(status().isOk());
        putAs(student, "/api/homework/" + homeworkId + "/submission", Map.of("text", "Again"))
                .andExpect(status().isConflict());
        getAs(student, "/api/homework-submissions").andExpect(jsonPath("$.data[0].grade").value("A"));
    }

    // ---------------------------------------------------------------- seating & admit cards

    @Test
    void seatingAlternatesClassesAndAppearsOnAdmitCards() throws Exception {
        String admin = admin();
        putAs(admin, "/api/exams/EXM-2026-PT2/seating", Map.of("rooms", List.of(Map.of("room", "R1", "capacity", 2))))
                .andExpect(status().isBadRequest()); // too small
        JsonNode plan = data(putAs(admin, "/api/exams/EXM-2026-PT2/seating", Map.of("rooms",
                List.of(Map.of("room", "R1", "capacity", 20), Map.of("room", "R2", "capacity", 40))))
                .andExpect(status().isOk()));
        JsonNode seats = plan.get("rooms").get(0).get("seats");
        assertThat(seats.get(0).get("className").asText()).isNotEqualTo(seats.get(1).get("className").asText());

        JsonNode cards = data(getAs(student(), "/api/exams/EXM-2026-PT2/admit-cards?studentId=" + ROHIT)
                .andExpect(status().isOk()));
        assertThat(cards.get("cards").get(0).get("room").asText()).startsWith("R");
        getAs(student(), "/api/exams/EXM-2026-PT2/admit-cards?className=5-B").andExpect(status().isForbidden());
        getAs(teacher(), "/api/exams/EXM-2026-PT2/admit-cards?className=5-B").andExpect(status().isOk());
    }

    // ---------------------------------------------------------------- bulk import

    @Test
    void studentsAreImportedFromCsvAfterADryRun() throws Exception {
        String csv = "Name,Class,Gender,DOB,Guardian Name,Guardian Phone,Guardian Email\n"
                + "Kabir Mehta,5b,M,12/04/2015,Anil Mehta,9811111111,anil@example.com\n"
                + "No Class Kid,12-Z,F,2015-01-01,,,\n";
        String admin = admin();
        JsonNode dry = data(postAs(admin, "/api/import/students", Map.of("csv", csv, "dryRun", true))
                .andExpect(status().isOk()));
        assertThat(dry.get("valid").asInt()).isEqualTo(1);
        assertThat(dry.get("failed").asInt()).isEqualTo(1);
        int before = store.students.count();
        assertThat(store.students.count()).isEqualTo(before);

        JsonNode real = data(postAs(admin, "/api/import/students", Map.of("csv", csv, "dryRun", false,
                "createLogins", true)).andExpect(status().isOk()));
        assertThat(real.get("created").asInt()).isEqualTo(1);
        assertThat(real.get("logins")).hasSize(2); // the student and the new parent
        assertThat(store.students.count()).isEqualTo(before + 1);
        getAs(teacher(), "/api/import/students/template").andExpect(status().isForbidden());
    }
}
