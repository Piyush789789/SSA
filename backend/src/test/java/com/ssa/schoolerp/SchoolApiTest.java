package com.ssa.schoolerp;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.MarksRecord;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SchoolApiTest extends ApiTestSupport {

    private static final String ROHIT = "STU-2026-0503";   // demo student, 5-B
    private static final String ANANYA = "STU-2026-0512";  // demo parent's child, 5-B
    private static final String YASH = "STU-2026-0824";    // demo parent's child, 8-A

    private LocalDate today() {
        return LocalDate.now(ZoneId.of("Asia/Kolkata"));
    }

    // ---------------------------------------------------------------- authentication and access

    @Test
    void requestsWithoutTokenAreRejected() throws Exception {
        mockMvc.perform(get("/api/students")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/students").header("Authorization", "not-a-bearer-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthAndLoginArePublic() throws Exception {
        mockMvc.perform(get("/api/health")).andExpect(status().isOk());
    }

    @Test
    void studentSeesOnlyThemself() throws Exception {
        String token = student();
        getAs(token, "/api/students")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(ROHIT));
        getAs(token, "/api/students/" + ANANYA).andExpect(status().isForbidden());
        getAs(token, "/api/attendance?studentId=" + ANANYA).andExpect(status().isForbidden());
        getAs(token, "/api/fees/students/" + ANANYA + "/summary").andExpect(status().isForbidden());
    }

    @Test
    void parentSeesOnlyTheirChildren() throws Exception {
        String token = parent();
        JsonNode students = data(getAs(token, "/api/students").andExpect(status().isOk()));
        List<String> ids = new ArrayList<>();
        students.forEach(s -> ids.add(s.get("id").asText()));
        assertThat(ids).containsExactlyInAnyOrder(ANANYA, YASH);
        getAs(token, "/api/results/students/" + ROHIT).andExpect(status().isForbidden());
    }

    @Test
    void teacherIsLimitedToAssignedClasses() throws Exception {
        String token = teacher(); // Anjali Singh: 5-B and 6-A
        getAs(token, "/api/classes/5-B/students").andExpect(status().isOk());
        getAs(token, "/api/classes/1-A/students").andExpect(status().isForbidden());
        getAs(token, "/api/fees/dues").andExpect(status().isForbidden());

        Map<String, Object> attendance = Map.of("className", "1-A", "date", today().toString(),
                "entries", List.of(Map.of("studentId", "STU-2026-0001", "status", "present")));
        putAs(token, "/api/attendance", attendance).andExpect(status().isForbidden());
    }

    @Test
    void studentsCannotReadOtherFamiliesPrivateMessages() throws Exception {
        // MSG-005 is a private reply to Ananya's parent; Rohit is in the same class but must not see it.
        getAs(student(), "/api/messages")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].id").value(hasItem("MSG-001")))
                .andExpect(jsonPath("$.data[*].id").value(not(hasItem("MSG-005"))))
                .andExpect(jsonPath("$.data[*].id").value(not(hasItem("MSG-002"))));
        getAs(parent(), "/api/messages")
                .andExpect(jsonPath("$.data[*].id").value(hasItem("MSG-005")))
                .andExpect(jsonPath("$.data[*].id").value(hasItem("MSG-004")));
    }

    @Test
    void familiesCannotBroadcastToAClass() throws Exception {
        postAs(parent(), "/api/messages", Map.of("recipientType", "CLASS", "className", "5-B",
                "subject", "Hi", "body", "Hello all")).andExpect(status().isForbidden());
        postAs(parent(), "/api/messages", Map.of("recipientType", "TEACHER", "recipientId", "TCH-2026-001",
                "subject", "Question", "body", "When is the PTM?")).andExpect(status().isCreated());
    }

    @Test
    void dashboardWorksForEveryRole() throws Exception {
        getAs(admin(), "/api/dashboard").andExpect(status().isOk()).andExpect(jsonPath("$.data.totalStudents").value(33));
        getAs(teacher(), "/api/dashboard").andExpect(status().isOk()).andExpect(jsonPath("$.data.teacher.name").value("Anjali Singh"));
        getAs(student(), "/api/dashboard").andExpect(status().isOk()).andExpect(jsonPath("$.data.student.id").value(ROHIT));
        getAs(parent(), "/api/dashboard").andExpect(status().isOk()).andExpect(jsonPath("$.data.children.length()").value(2));
    }

    // ---------------------------------------------------------------- attendance

    @Test
    void remarkingADayOverwritesInsteadOfDuplicating() throws Exception {
        String token = teacher();
        String date = today().toString();
        Map<String, Object> request = Map.of("className", "5-B", "date", date,
                "entries", List.of(Map.of("studentId", ROHIT, "status", "absent")));
        putAs(token, "/api/attendance", request).andExpect(status().isOk());
        putAs(token, "/api/attendance", Map.of("className", "5-B", "date", date,
                "entries", List.of(Map.of("studentId", ROHIT, "status", "late")))).andExpect(status().isOk());

        getAs(token, "/api/attendance?studentId=" + ROHIT + "&date=" + date)
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].status").value("late"));
    }

    @Test
    void attendanceRejectsFutureDatesAndStudentsFromOtherClasses() throws Exception {
        String token = teacher();
        putAs(token, "/api/attendance", Map.of("className", "5-B", "date", today().plusDays(1).toString(),
                "entries", List.of(Map.of("studentId", ROHIT, "status", "present")))).andExpect(status().isBadRequest());
        putAs(token, "/api/attendance", Map.of("className", "5-B", "date", today().toString(),
                "entries", List.of(Map.of("studentId", "STU-2026-0601", "status", "present")))).andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------- exams and marks

    @Test
    void marksSheetListsWholeClassAndSavingTwiceDoesNotDuplicate() throws Exception {
        String token = teacher();
        // SCH-008 (Test 2, Maths, 5-B) has marks for 7 of 9 students.
        JsonNode sheet = data(getAs(token, "/api/exam-schedules/SCH-008/marks").andExpect(status().isOk()));
        assertThat(sheet.get("rows")).hasSize(9);

        Map<String, Object> request = Map.of("submit", true, "entries", List.of(
                Map.of("studentId", "STU-2026-0508", "obtainedMarks", 41),
                Map.of("studentId", ANANYA, "absent", true),
                Map.of("studentId", ROHIT)));  // blank: must not become 0
        putAs(token, "/api/exam-schedules/SCH-008/marks", request).andExpect(status().isOk());
        putAs(token, "/api/exam-schedules/SCH-008/marks", request).andExpect(status().isOk());

        assertThat(store.marks.findWhere(m -> m.scheduleId().equals("SCH-008"))).hasSize(9);
        MarksRecord rohit = store.marks.getById(MarksRecord.idFor("SCH-008", ROHIT));
        assertThat(rohit.obtainedMarks()).isNotEqualTo(0.0); // the seeded value was kept
    }

    @Test
    void marksAboveMaximumAreRejectedAndNothingIsSaved() throws Exception {
        Map<String, Object> request = Map.of("submit", false, "entries", List.of(
                Map.of("studentId", "STU-2026-0606", "obtainedMarks", 40),
                Map.of("studentId", "STU-2026-0607", "obtainedMarks", 51)));
        putAs(teacher(), "/api/exam-schedules/SCH-009/marks", request).andExpect(status().isBadRequest());
        assertThat(store.marks.findById(MarksRecord.idFor("SCH-009", "STU-2026-0606"))).isEmpty();
    }

    @Test
    void teacherCannotEnterMarksForAnotherSubjectOrBeforeTheExam() throws Exception {
        Map<String, Object> request = Map.of("entries", List.of(Map.of("studentId", ROHIT, "obtainedMarks", 10)));
        putAs(teacher(), "/api/exam-schedules/SCH-003/marks", request).andExpect(status().isForbidden()); // Hindi
        putAs(teacher(), "/api/exam-schedules/SCH-011/marks", request).andExpect(status().isBadRequest()); // upcoming
    }

    @Test
    void familiesOnlySeePublishedResults() throws Exception {
        String token = student();
        JsonNode result = data(getAs(token, "/api/results/students/" + ROHIT).andExpect(status().isOk()));
        result.get("subjects").forEach(s -> assertThat(s.get("examId").asText()).isEqualTo("EXM-2026-UT1"));

        postAs(admin(), "/api/exams/EXM-2026-PT2/publish", Map.of()).andExpect(status().isOk());
        JsonNode after = data(getAs(token, "/api/results/students/" + ROHIT));
        List<String> examIds = new ArrayList<>();
        after.get("subjects").forEach(s -> examIds.add(s.get("examId").asText()));
        assertThat(examIds).contains("EXM-2026-PT2");
    }

    @Test
    void examEndDateCannotPrecedeStartDate() throws Exception {
        Map<String, Object> exam = Map.of("name", "Bad Exam", "type", "Unit Test",
                "startDate", "2026-12-10", "endDate", "2026-12-01", "classes", List.of("5-B"));
        postAs(admin(), "/api/exams", exam)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("End date must be on or after the start date"));
    }

    // ---------------------------------------------------------------- fees

    @Test
    void paymentsCannotExceedWhatIsOwedAndReduceThePendingAmount() throws Exception {
        String token = admin();
        FeeDue due = anyDueWithPendingOver(1000);

        postAs(token, "/api/fees/payments", Map.of("feeDueId", due.id(), "amount", due.pending() + 1,
                "paymentMode", "UPI")).andExpect(status().isBadRequest());
        postAs(token, "/api/fees/payments", Map.of("feeDueId", due.id(), "amount", 1000, "paymentMode", "UPI"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.receiptNo").isNotEmpty());
        assertThat(store.feeDues.getById(due.id()).pending()).isEqualTo(due.pending() - 1000);
    }

    @Test
    void concessionsLowerTheAmountOwed() throws Exception {
        FeeDue due = anyDueWithPendingOver(500);
        postAs(admin(), "/api/fees/concessions", Map.of("feeDueId", due.id(), "type", "Merit",
                "discountType", "FLAT", "discountValue", 500, "description", "Test"))
                .andExpect(status().isCreated());
        assertThat(store.feeDues.getById(due.id()).pending()).isEqualTo(due.pending() - 500);

        postAs(admin(), "/api/fees/concessions", Map.of("feeDueId", due.id(), "type", "Merit",
                "discountType", "PERCENTAGE", "discountValue", 100, "description", "Too much"))
                .andExpect(status().isBadRequest());
    }

    private FeeDue anyDueWithPendingOver(long amount) {
        return store.feeDues.findWhere(d -> d.pending() > amount).get(0);
    }

    @Test
    void aStudentCannotBeBilledTwiceForTheSameFee() throws Exception {
        postAs(admin(), "/api/fees/dues", Map.of("studentId", ROHIT, "feeHeadId", "FH-Q1"))
                .andExpect(status().isConflict());
    }

    @Test
    void newStudentsAreBilledAndGetTheNextRollNumber() throws Exception {
        Map<String, Object> student = Map.of("name", "New Student", "className", "5-B", "gender", "Female",
                "guardian", Map.of("name", "Guardian Name"));
        JsonNode created = data(postAs(admin(), "/api/students", student).andExpect(status().isCreated()));
        assertThat(created.get("rollNumber").asInt()).isEqualTo(10);
        String id = created.get("id").asText();
        assertThat(store.feeDues.findWhere(d -> d.studentId().equals(id))).hasSize(5);

        postAs(admin(), "/api/students", Map.of("name", "Clash", "className", "5-B", "rollNumber", 10))
                .andExpect(status().isConflict());
    }

    // ---------------------------------------------------------------- fee deposits reported from the app

    @Test
    void depositIsOnlyCountedAfterAdminApproval() throws Exception {
        FeeDue due = childDueWithPending();
        long amount = Math.min(500, due.pending());
        JsonNode deposit = data(postAs(parent(), "/api/fees/deposits", Map.of("feeDueId", due.id(), "amount", amount,
                "paymentMode", "UPI", "referenceNo", "UTR123456", "paidOn", today().toString()))
                .andExpect(status().isCreated()));
        assertThat(deposit.get("status").asText()).isEqualTo("PENDING");
        assertThat(store.feeDues.getById(due.id()).pending()).isEqualTo(due.pending()); // not counted yet

        postAs(admin(), "/api/fees/deposits/" + deposit.get("id").asText() + "/approve", Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
        assertThat(store.feeDues.getById(due.id()).pending()).isEqualTo(due.pending() - amount);
        postAs(admin(), "/api/fees/deposits/" + deposit.get("id").asText() + "/approve", Map.of())
                .andExpect(status().isConflict());
    }

    @Test
    void parentDepositIsValidatedAndCanBeRejected() throws Exception {
        String token = parent();
        FeeDue due = childDueWithPending();

        postAs(token, "/api/fees/deposits", Map.of("feeDueId", due.id(), "amount", due.pending() + 1,
                "paymentMode", "UPI", "referenceNo", "UTR-1", "paidOn", today().toString()))
                .andExpect(status().isBadRequest());
        postAs(token, "/api/fees/deposits", Map.of("feeDueId", due.id(), "amount", 1,
                "paymentMode", "UPI", "paidOn", today().toString()))
                .andExpect(status().isBadRequest()); // reference number missing
        JsonNode deposit = data(postAs(token, "/api/fees/deposits", Map.of("feeDueId", due.id(), "amount", 1,
                "paymentMode", "Bank Transfer", "referenceNo", "NEFT-77", "paidOn", today().toString()))
                .andExpect(status().isCreated()));
        postAs(token, "/api/fees/deposits", Map.of("feeDueId", due.id(), "amount", 1,
                "paymentMode", "UPI", "referenceNo", "neft-77", "paidOn", today().toString()))
                .andExpect(status().isConflict()); // same reference again

        postAs(admin(), "/api/fees/deposits/" + deposit.get("id").asText() + "/reject", Map.of("note", "Not received"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
        assertThat(store.feeDues.getById(due.id()).pending()).isEqualTo(due.pending());
    }

    @Test
    void familiesCannotDepositForOtherStudentsAndTeachersCannotDepositAtAll() throws Exception {
        FeeDue someoneElses = store.feeDues.findWhere(d -> !d.studentId().equals(ROHIT) && d.pending() > 0).get(0);
        postAs(student(), "/api/fees/deposits", Map.of("feeDueId", someoneElses.id(), "amount", 1,
                "paymentMode", "UPI", "referenceNo", "X1", "paidOn", today().toString()))
                .andExpect(status().isForbidden());
        postAs(teacher(), "/api/fees/deposits", Map.of("feeDueId", someoneElses.id(), "amount", 1,
                "paymentMode", "UPI", "referenceNo", "X2", "paidOn", today().toString()))
                .andExpect(status().isForbidden());
    }

    private FeeDue childDueWithPending() {
        return store.feeDues.findWhere(d -> (d.studentId().equals(ANANYA) || d.studentId().equals(YASH))
                && d.pending() > 0).get(0);
    }

    // ---------------------------------------------------------------- self-service and admin extras

    @Test
    void teachersEditTheirOwnProfileButNotTheirClasses() throws Exception {
        putAs(teacher(), "/api/me/teacher-profile", Map.of("name", "Anjali S. Singh", "email", "anjali@ssa.edu",
                "phone", "+91 90000 00000", "qualification", "M.Sc", "experience", "9 years"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignedClasses[0]").value("5-B"));
        // The rename is copied to the timetable so it keeps working.
        assertThat(store.timetable.findWhere(e -> "TCH-2026-001".equals(e.teacherId())))
                .allMatch(e -> e.teacherName().equals("Anjali S. Singh"));
        putAs(student(), "/api/me/teacher-profile", Map.of("name", "X", "email", "x@ssa.edu"))
                .andExpect(status().isForbidden());
    }

    @Test
    void familiesUpdateContactDetailsOnlyForTheirOwnStudents() throws Exception {
        Map<String, Object> contact = Map.of("address", "1 New Road", "guardianPhone", "+91 91111 11111",
                "guardianEmail", "dad@example.com");
        putAs(parent(), "/api/students/" + ANANYA + "/contact", contact).andExpect(status().isOk());
        assertThat(store.students.getById(ANANYA).address()).isEqualTo("1 New Road");
        putAs(parent(), "/api/students/" + ROHIT + "/contact", contact).andExpect(status().isForbidden());
        putAs(teacher(), "/api/students/" + ROHIT + "/contact", contact).andExpect(status().isForbidden());
    }

    @Test
    void clearingAMarkRemovesIt() throws Exception {
        String id = MarksRecord.idFor("SCH-008", "STU-2026-0501");
        assertThat(store.marks.findById(id)).isPresent();
        putAs(teacher(), "/api/exam-schedules/SCH-008/marks",
                Map.of("entries", List.of(Map.of("studentId", "STU-2026-0501", "clear", true))))
                .andExpect(status().isOk());
        assertThat(store.marks.findById(id)).isEmpty();
        getAs(admin(), "/api/exam-schedules/marks-progress?examId=EXM-2026-PT2")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].totalStudents").isNumber());
    }

    @Test
    void withdrawingAConcessionRestoresTheAmountOwed() throws Exception {
        FeeDue due = anyDueWithPendingOver(500);
        JsonNode concession = data(postAs(admin(), "/api/fees/concessions", Map.of("feeDueId", due.id(), "type", "Merit",
                "discountType", "FLAT", "discountValue", 500, "description", "Test")));
        mockMvc.perform(delete("/api/fees/concessions/" + concession.get("id").asText())
                        .header("Authorization", "Bearer " + admin()))
                .andExpect(status().isOk());
        assertThat(store.feeDues.getById(due.id()).pending()).isEqualTo(due.pending());
    }

    // ---------------------------------------------------------------- daily schedule

    @Test
    void studentDashboardIncludesTodaysFullSchedule() throws Exception {
        JsonNode schedule = data(getAs(student(), "/api/dashboard")).get("todaySchedule");
        if (today().getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            assertThat(schedule).isEmpty();
        } else {
            assertThat(schedule).hasSize(10); // every period and break of the day
        }
        getAs(student(), "/api/timetable/day?className=5-B&day=MONDAY")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].startTime").value("08:00"))
                .andExpect(jsonPath("$.data[0].subject").value("Mathematics"));
        getAs(student(), "/api/timetable/day?className=6-A&day=MONDAY").andExpect(status().isForbidden());
    }

    @Test
    void periodTimesUseTheFrontendFormat() throws Exception {
        getAs(student(), "/api/timetable/periods")
                .andExpect(jsonPath("$.data[0].startTime").value("08:00"))
                .andExpect(jsonPath("$.data[0].endTime").value("08:45"));
    }

    // ---------------------------------------------------------------- error handling

    @Test
    void errorsKeepTheirHttpStatus() throws Exception {
        String token = admin();
        mockMvc.perform(post("/api/exams").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request body"));
        mockMvc.perform(delete("/api/health")).andExpect(status().isMethodNotAllowed());
        getAs(token, "/api/students/NOPE").andExpect(status().isNotFound());
        getAs(token, "/api/attendance?date=yesterday").andExpect(status().isBadRequest());
    }

    @Test
    void validationErrorsNameTheField() throws Exception {
        postAs(admin(), "/api/notices", Map.of("description", "No title"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("title")));
    }
}
