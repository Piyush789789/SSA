package com.ssa.schoolerp;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssa.schoolerp.model.FeeDue;
import com.ssa.schoolerp.model.Guardian;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.service.NotificationService;
import com.ssa.schoolerp.service.payments.RazorpayGateway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Settings, promotion, audit log, certificates, report cards, notifications, online payment and backups. */
@Import(SchoolOperationsTest.FakeRazorpay.class)
class SchoolOperationsTest extends ApiTestSupport {

    /** Razorpay without the network: orders get ids order_TEST1, order_TEST2, …; signatures are checked for real. */
    @TestConfiguration
    static class FakeRazorpay {
        @Bean
        @Primary
        RazorpayGateway fakeRazorpayGateway(ObjectMapper json) {
            AtomicInteger next = new AtomicInteger();
            return new RazorpayGateway("rzp_test_dummy", "test_secret", "test_webhook_secret", json) {
                @Override
                public String createOrder(long amountPaise, String receipt, Map<String, String> notes) {
                    return "order_TEST" + next.incrementAndGet();
                }
            };
        }
    }

    private static final String ROHIT = "STU-2026-0503";  // demo student, 5-B
    private static final String ANANYA = "STU-2026-0512"; // demo parent's child, 5-B

    @Autowired
    private NotificationService notifications;

    private LocalDate today() {
        return LocalDate.now(ZoneId.of("Asia/Kolkata"));
    }

    /** Today, or yesterday on a Sunday (no attendance is taken on Sundays). */
    private LocalDate schoolDay() {
        LocalDate today = today();
        return today.getDayOfWeek() == java.time.DayOfWeek.SUNDAY ? today.minusDays(1) : today;
    }

    // ---------------------------------------------------------------- settings & promotion

    @Test
    void settingsArePublicToReadButOnlyAdminsChangeThem() throws Exception {
        mockMvc.perform(get("/api/settings")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentAcademicYear").value("2026-27"));
        Map<String, Object> body = Map.of("schoolName", "SSA Academy", "board", "CBSE", "udiseCode", "09123456789",
                "currentAcademicYear", "2026-27");
        putAs(teacher(), "/api/settings", body).andExpect(status().isForbidden());
        putAs(admin(), "/api/settings", body).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.udiseCode").value("09123456789"));
    }

    @Test
    void promotionMovesEveryoneUpGraduatesClassTenAndKeepsDetainedStudents() throws Exception {
        store.students.save(new Student("STU-TEST-10", "Senior Student", "10-A", 1, "Male", LocalDate.of(2011, 1, 1),
                null, null, null, null, new Guardian("Guardian", "Father", null, null)));
        String admin = admin();
        Map<String, Object> request = Map.of("toAcademicYear", "2027-28", "detainedStudentIds", List.of(ANANYA),
                "dryRun", true);
        JsonNode preview = data(postAs(admin, "/api/admin/promotion", request).andExpect(status().isOk()));
        assertThat(preview.get("graduated").asInt()).isEqualTo(1);
        assertThat(store.students.getById(ROHIT).className()).isEqualTo("5-B"); // dry run changes nothing

        postAs(admin, "/api/admin/promotion", Map.of("toAcademicYear", "2027-28", "detainedStudentIds", List.of(ANANYA),
                "dryRun", false)).andExpect(status().isOk());
        assertThat(store.students.getById(ROHIT).className()).isEqualTo("6-B");
        assertThat(store.students.getById(ANANYA).className()).isEqualTo("5-B");
        assertThat(store.students.getById("STU-TEST-10").status()).isEqualTo(Student.GRADUATED);
        assertThat(store.settings.findAll().get(0).currentAcademicYear()).isEqualTo("2027-28");
        // Roll numbers are 1..n again in each class.
        assertThat(store.studentsOf("6-B")).extracting(Student::rollNumber).doesNotHaveDuplicates();
        getAs(admin, "/api/students?className=10-A").andExpect(jsonPath("$.data.length()").value(0));
        getAs(admin, "/api/students?className=10-A&status=all").andExpect(jsonPath("$.data.length()").value(1));
    }

    // ---------------------------------------------------------------- audit

    @Test
    void changesAreRecordedInTheAuditLog() throws Exception {
        putAs(teacher(), "/api/attendance", Map.of("className", "5-B", "date", schoolDay().toString(),
                "entries", List.of(Map.of("studentId", ROHIT, "status", "present")))).andExpect(status().isOk());
        getAs(admin(), "/api/admin/audit?q=anjali")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].action").value(hasItem("Marked attendance")));
        getAs(teacher(), "/api/admin/audit").andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- certificates & report cards

    @Test
    void issuingATransferCertificateMarksTheStudentAsLeftAndDisablesTheLogin() throws Exception {
        String admin = admin();
        JsonNode tc = data(postAs(admin, "/api/students/" + ROHIT + "/certificates", Map.of("type", "TC",
                "reason", "Family relocating", "conduct", "Good")).andExpect(status().isCreated()));
        assertThat(tc.get("id").asText()).startsWith("TC-");
        assertThat(store.students.getById(ROHIT).status()).isEqualTo(Student.LEFT);
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "student@ssa.edu",
                                "password", "student123", "role", "STUDENT"))))
                .andExpect(status().isForbidden());
        getAs(admin, "/api/certificates/" + tc.get("id").asText()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.school.schoolName").isNotEmpty())
                .andExpect(jsonPath("$.data.certificate.studentName").value("Rohit Verma"));
        postAs(admin, "/api/students/" + ROHIT + "/certificates", Map.of("type", "TC")).andExpect(status().isConflict());
    }

    @Test
    void reportCardShowsPublishedMarksAndTheTeachersNotes() throws Exception {
        JsonNode card = data(getAs(student(), "/api/report-cards/" + ROHIT).andExpect(status().isOk()));
        assertThat(card.get("subjects").size()).isGreaterThan(0);
        assertThat(card.get("exams").get(0).get("id").asText()).isEqualTo("EXM-2026-UT1"); // only published exams
        putAs(teacher(), "/api/report-cards/" + ROHIT + "/notes", Map.of("term", "Term 1", "remark", "Works hard.",
                "coScholastic", Map.of("Discipline", "A", "Art Education", "B"))).andExpect(status().isOk());
        putAs(student(), "/api/report-cards/" + ROHIT + "/notes", Map.of("term", "Term 1")).andExpect(status().isForbidden());
        putAs(teacher(), "/api/report-cards/" + ROHIT + "/notes", Map.of("term", "Term 1",
                "coScholastic", Map.of("Discipline", "Z"))).andExpect(status().isBadRequest());
        getAs(parent(), "/api/report-cards/" + ANANYA).andExpect(status().isOk());
        getAs(parent(), "/api/report-cards/" + ROHIT).andExpect(status().isForbidden());
        JsonNode after = data(getAs(student(), "/api/report-cards/" + ROHIT));
        assertThat(after.get("notes").get(0).get("remark").asText()).isEqualTo("Works hard.");
    }

    // ---------------------------------------------------------------- notifications

    @Test
    void anAbsenceNotifiesTheStudentAndCanBeMarkedRead() throws Exception {
        putAs(teacher(), "/api/attendance", Map.of("className", "5-B", "date", schoolDay().toString(),
                "entries", List.of(Map.of("studentId", ANANYA, "status", "absent")))).andExpect(status().isOk());
        String parent = parent();
        getAs(parent, "/api/notifications").andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].category").value("ATTENDANCE"))
                .andExpect(jsonPath("$.data[0].body", containsString("Ananya Verma")));
        assertThat(data(getAs(parent, "/api/notifications/unread-count")).get("unread").asLong()).isPositive();
        postAs(parent, "/api/notifications/read-all", Map.of()).andExpect(status().isOk());
        assertThat(data(getAs(parent, "/api/notifications/unread-count")).get("unread").asLong()).isZero();
    }

    @Test
    void feeRemindersGoOutOncePerDay() {
        store.feeDues.save(new FeeDue("DUE-TEST-REMINDER", ROHIT, "FH-Q3", "Test fee", 1000, 0, 0, today().plusDays(3)));
        assertThat(notifications.feeReminders(today())).isPositive();
        assertThat(store.notifications.where("e.recipientId = ?1 and e.category = ?2", ROHIT, "FEE_REMINDER")).hasSize(1);
        notifications.feeReminders(today());
        assertThat(store.notifications.where("e.recipientId = ?1 and e.category = ?2", ROHIT, "FEE_REMINDER")).hasSize(1);
    }

    // ---------------------------------------------------------------- online payment

    @Test
    void onlinePaymentIsRecordedOnlyWithAValidRazorpaySignatureAndOnlyOnce() throws Exception {
        FeeDue due = store.feeDues.findWhere(d -> d.studentId().equals(ANANYA) && d.pending() > 100).get(0);
        String parent = parent();

        JsonNode order = data(postAs(parent, "/api/online-payments/orders", Map.of("feeDueId", due.id(), "amount", 100))
                .andExpect(status().isOk()));
        assertThat(order.get("amountPaise").asLong()).isEqualTo(10000);
        String orderId = order.get("orderId").asText();

        Map<String, Object> forged = Map.of("orderId", orderId, "paymentId", "pay_1", "signature", "bad");
        mockMvc.perform(post("/api/online-payments/confirm").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forged))).andExpect(status().isBadRequest());

        Map<String, Object> good = Map.of("orderId", orderId, "paymentId", "pay_1",
                "signature", hmac("test_secret", orderId + "|pay_1"));
        for (int i = 0; i < 2; i++) { // the second call must not record the money twice
            mockMvc.perform(post("/api/online-payments/confirm").contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(good))).andExpect(status().isOk());
        }
        assertThat(store.feeDues.getById(due.id()).pending()).isEqualTo(due.pending() - 100);
        mockMvc.perform(get("/api/online-payments/checkout/" + orderId))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("already complete")));
    }

    @Test
    void theWebhookAlsoRecordsAPayment() throws Exception {
        FeeDue due = store.feeDues.findWhere(d -> d.studentId().equals(ANANYA) && d.pending() > 50).get(0);
        String orderId = data(postAs(parent(), "/api/online-payments/orders", Map.of("feeDueId", due.id(), "amount", 50))
                .andExpect(status().isOk())).get("orderId").asText();
        String body = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":"
                + "{\"id\":\"pay_W\",\"order_id\":\"" + orderId + "\",\"status\":\"captured\"}}}}";
        mockMvc.perform(post("/api/online-payments/webhook").contentType(MediaType.APPLICATION_JSON).content(body)
                        .header("X-Razorpay-Signature", hmac("test_webhook_secret", body)))
                .andExpect(status().isOk());
        assertThat(store.feeDues.getById(due.id()).pending()).isEqualTo(due.pending() - 50);
        mockMvc.perform(post("/api/online-payments/webhook").contentType(MediaType.APPLICATION_JSON).content(body)
                .header("X-Razorpay-Signature", "forged")).andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------- backups

    @Test
    void backupsReportThatTheyNeedPostgres() throws Exception {
        getAs(admin(), "/api/admin/backups").andExpect(jsonPath("$.data.enabled").value(false));
        postAs(admin(), "/api/admin/backups", Map.of()).andExpect(status().isBadRequest());
    }

    private static String hmac(String secret, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }
}
