package com.ssa.schoolerp;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Admissions, transport, library, ID cards, PTM, health, at-risk alerts and fee reminders. */
class CampusTest extends ApiTestSupport {

    private static final String ROHIT = "STU-2026-0503";  // demo student, 5-B
    private static final String ANANYA = "STU-2026-0512"; // demo parent's child, 5-B
    private static final String YASH = "STU-2026-0824";   // demo parent's child, 8-A

    private LocalDate nextWeekday() {
        LocalDate day = LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(1);
        return day.getDayOfWeek() == DayOfWeek.SUNDAY ? day.plusDays(1) : day;
    }

    private ResultActions publicEnquiry(String ip, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post("/api/enquiries/public").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
                .with(request -> {
                    request.setRemoteAddr(ip);
                    return request;
                }));
    }

    // ---------------------------------------------------------------- admissions

    @Test
    void websiteEnquiryCanBeAdmittedAsAStudent() throws Exception {
        String id = data(publicEnquiry("10.0.0.1", Map.of("studentName", "Kiara Shah", "classSought", "5",
                "parentName", "Rohan Shah", "phone", "+91 90000 11111", "email", "rohan@example.com"))
                .andExpect(status().isCreated())).get("id").asText();
        publicEnquiry("10.0.0.1", Map.of("studentName", "x")).andExpect(status().isBadRequest());

        String admin = admin();
        getAs(admin, "/api/enquiries?status=NEW").andExpect(jsonPath("$.data[?(@.id == '" + id + "')].source")
                .value("Website"));
        postAs(admin, "/api/enquiries/" + id + "/status", Map.of("status", "ADMITTED")).andExpect(status().isBadRequest());
        JsonNode result = data(postAs(admin, "/api/enquiries/" + id + "/admit", Map.of("className", "5-A",
                "guardianRelation", "Father", "createLogins", true)).andExpect(status().isOk()));
        String studentId = result.get("studentId").asText();
        assertThat(result.get("logins")).hasSize(2);
        assertThat(store.students.getById(studentId).className()).isEqualTo("5-A");
        postAs(admin, "/api/enquiries/" + id + "/admit", Map.of("className", "5-A")).andExpect(status().isConflict());
        getAs(admin, "/api/enquiries/stats").andExpect(jsonPath("$.data.byStatus.ADMITTED").value(1));
        getAs(teacher(), "/api/enquiries").andExpect(status().isForbidden());
    }

    @Test
    void theWebsiteFormIsRateLimited() throws Exception {
        Map<String, Object> body = Map.of("studentName", "Spam", "classSought", "1", "parentName", "Bot",
                "phone", "9999999999");
        for (int i = 0; i < 5; i++) publicEnquiry("10.0.0.99", body).andExpect(status().isCreated());
        publicEnquiry("10.0.0.99", body).andExpect(status().isTooManyRequests());
    }

    // ---------------------------------------------------------------- transport

    @Test
    void familiesSeeTheirBusAndAdminsManageRoutes() throws Exception {
        getAs(student(), "/api/transport/students/" + ROHIT).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.route.driverName").value("Ramesh Kumar"))
                .andExpect(jsonPath("$.data.stop.name").value("Collectorate"));
        getAs(student(), "/api/transport/students/" + ANANYA).andExpect(status().isForbidden());

        String admin = admin();
        putAs(admin, "/api/transport/assignments", Map.of("studentId", YASH, "routeId", "RT-002", "stopName", "Nowhere"))
                .andExpect(status().isBadRequest());
        putAs(admin, "/api/transport/assignments", Map.of("studentId", YASH, "routeId", "RT-002", "stopName", "Dayalbagh"))
                .andExpect(status().isOk());
        getAs(parent(), "/api/transport/students/" + YASH).andExpect(jsonPath("$.data.route.name").value("Route 2 - Kamla Nagar"));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/transport/routes/RT-001")
                .header("Authorization", "Bearer " + admin)).andExpect(status().isConflict());
    }

    // ---------------------------------------------------------------- library

    @Test
    void booksAreIssuedAndLateReturnsAreFined() throws Exception {
        String admin = admin();
        postAs(admin, "/api/library/issues", Map.of("bookId", "BK-001", "borrowerId", ROHIT)).andExpect(status().isCreated());
        postAs(admin, "/api/library/issues", Map.of("bookId", "BK-001", "borrowerId", ROHIT)).andExpect(status().isConflict());
        getAs(admin, "/api/library/issues?status=overdue").andExpect(jsonPath("$.data[0].id").value("ISS-001"));
        postAs(admin, "/api/library/issues/ISS-001/return", Map.of()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fine").value(12)); // 6 days late at Rs 2
        getAs(student(), "/api/library/my-loans").andExpect(jsonPath("$.data.length()").value(2));
        getAs(student(), "/api/library/books?q=malgudi").andExpect(jsonPath("$.data[0].available").value(4));
        postAs(student(), "/api/library/issues", Map.of("bookId", "BK-002", "borrowerId", ROHIT))
                .andExpect(status().isForbidden());
    }

    @Test
    void aLibrarianLoginCanOnlyChangeTheLibrary() throws Exception {
        JsonNode created = data(postAs(admin(), "/api/accounts/staff", Map.of("name", "Meena Librarian",
                "loginId", "meena@ssa.edu", "permissions", List.of("LIBRARY"))).andExpect(status().isCreated()));
        String token = login("meena@ssa.edu", created.get("temporaryPassword").asText(), "ADMIN");
        postAs(token, "/api/library/issues", Map.of("bookId", "BK-002", "borrowerId", ROHIT)).andExpect(status().isCreated());
        postAs(token, "/api/transport/routes", Map.of("name", "X", "capacity", 10)).andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- ID cards & photos

    @Test
    void idCardsShowThePhotoAndBusRoute() throws Exception {
        String teacher = teacher();
        MockMultipartFile photo = new MockMultipartFile("file", "rohit.jpg", "image/jpeg", new byte[]{9, 9});
        String body = mockMvc.perform(multipart("/api/files").file(photo).header("Authorization", "Bearer " + teacher))
                .andReturn().getResponse().getContentAsString();
        String fileId = objectMapper.readTree(body).get("data").get("id").asText();
        putAs(teacher, "/api/students/" + ROHIT + "/photo", Map.of("fileId", fileId)).andExpect(status().isOk());

        JsonNode cards = data(getAs(teacher, "/api/id-cards?className=5-B").andExpect(status().isOk()));
        JsonNode rohit = null;
        for (JsonNode card : cards.get("cards")) if (card.get("id").asText().equals(ROHIT)) rohit = card;
        assertThat(rohit).isNotNull();
        assertThat(rohit.get("photoFileId").asText()).isEqualTo(fileId);
        assertThat(rohit.get("transportRoute").asText()).isEqualTo("Route 1 - Civil Lines");
        getAs(student(), "/api/id-cards?className=5-B").andExpect(status().isForbidden());
        getAs(student(), "/api/id-cards?studentId=" + ROHIT).andExpect(status().isOk());
        getAs(teacher, "/api/id-cards?teachers=true").andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- PTM

    @Test
    void parentsBookParentTeacherMeetingSlots() throws Exception {
        LocalDate day = nextWeekday();
        JsonNode slots = data(postAs(teacher(), "/api/ptm/slots", Map.of("title", "Term 1 PTM", "date", day.toString(),
                "from", "10:00", "to", "11:00", "minutes", 15, "location", "Room 5")).andExpect(status().isCreated()));
        assertThat(slots).hasSize(4);
        String slotId = slots.get(0).get("id").asText();

        String parent = parent();
        JsonNode visible = data(getAs(parent, "/api/ptm/slots").andExpect(status().isOk()));
        assertThat(visible.size()).isGreaterThanOrEqualTo(4);
        postAs(parent, "/api/ptm/slots/" + slotId + "/book", Map.of("studentId", ANANYA)).andExpect(status().isOk());
        postAs(parent, "/api/ptm/slots/" + slots.get(1).get("id").asText() + "/book", Map.of("studentId", ANANYA))
                .andExpect(status().isConflict()); // one slot per child per teacher per day
        postAs(parent, "/api/ptm/slots/" + slotId + "/book", Map.of("studentId", ANANYA)).andExpect(status().isConflict());
        getAs(teacher(), "/api/ptm/slots").andExpect(jsonPath("$.data[0].studentName").value("Ananya Verma"));
        getAs(student(), "/api/ptm/slots").andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- health

    @Test
    void sickRoomVisitsAreRecordedAndTheFamilyIsTold() throws Exception {
        getAs(student(), "/api/health-records/" + ROHIT).andExpect(jsonPath("$.data.allergies").value("Peanuts"));
        putAs(student(), "/api/health-records/" + ROHIT, Map.of("allergies", "None")).andExpect(status().isForbidden());
        postAs(teacher(), "/api/health-records/" + ANANYA + "/visits", Map.of("complaint", "Fever 101F",
                "actionTaken", "Gave water, rested", "sentHome", true)).andExpect(status().isCreated());
        getAs(parent(), "/api/notifications").andExpect(jsonPath("$.data[0].title").value("Please collect your child"));
        getAs(parent(), "/api/health-records/" + ANANYA + "/visits").andExpect(jsonPath("$.data.length()").value(1));
    }

    // ---------------------------------------------------------------- insights & reminders

    @Test
    void atRiskStudentsAreListedForStaffOnly() throws Exception {
        JsonNode atRisk = data(getAs(admin(), "/api/insights/at-risk").andExpect(status().isOk()));
        assertThat(atRisk.size()).isGreaterThan(0);
        assertThat(atRisk.get(0).get("reasons").size()).isGreaterThan(0);
        getAs(teacher(), "/api/insights/at-risk?className=5-B").andExpect(status().isOk());
        getAs(teacher(), "/api/insights/at-risk?className=1-A").andExpect(status().isForbidden());
        getAs(student(), "/api/insights/at-risk").andExpect(status().isForbidden());
        postAs(admin(), "/api/fee-reminders/send", Map.of()).andExpect(status().isOk());
    }
}
