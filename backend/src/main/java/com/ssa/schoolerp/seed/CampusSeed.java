package com.ssa.schoolerp.seed;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ssa.schoolerp.model.AdmissionEnquiry;
import com.ssa.schoolerp.model.Album;
import com.ssa.schoolerp.model.Book;
import com.ssa.schoolerp.model.BookIssue;
import com.ssa.schoolerp.model.HealthProfile;
import com.ssa.schoolerp.model.TransportAssignment;
import com.ssa.schoolerp.model.TransportRoute;
import com.ssa.schoolerp.repository.DataStore;

import java.time.LocalDate;
import java.util.List;

/**
 * Demo data for transport, library, admissions, health and the gallery. Entities with many optional fields are
 * written as JSON (the same way the API receives them).
 */
final class CampusSeed {

    private static final ObjectMapper JSON = JsonMapper.builder().addModule(new JavaTimeModule()).build();

    private CampusSeed() {
    }

    static void populate(DataStore s, LocalDate today) {
        s.routes.save(read("""
                {"name":"Route 1 - Civil Lines","vehicleNumber":"UP80 AT 1234","driverName":"Ramesh Kumar",
                 "driverPhone":"+91 98370 11111","attendantName":"Sunita Devi","attendantPhone":"+91 98370 22222",
                 "capacity":40,"monthlyFee":1200,
                 "stops":[{"name":"Civil Lines Chowk","pickupTime":"07:05","dropTime":"14:20"},
                          {"name":"Collectorate","pickupTime":"07:15","dropTime":"14:10"},
                          {"name":"Sanjay Place","pickupTime":"07:25","dropTime":"14:00"}]}""",
                TransportRoute.class).withId("RT-001"));
        s.routes.save(read("""
                {"name":"Route 2 - Kamla Nagar","vehicleNumber":"UP80 BT 5678","driverName":"Iqbal Khan",
                 "driverPhone":"+91 98370 33333","capacity":32,"monthlyFee":1000,
                 "stops":[{"name":"Kamla Nagar","pickupTime":"07:00","dropTime":"14:25"},
                          {"name":"Dayalbagh","pickupTime":"07:12","dropTime":"14:12"}]}""",
                TransportRoute.class).withId("RT-002"));
        s.transportAssignments.save(new TransportAssignment(SeedData.DEMO_STUDENT_ID, "RT-001", "Collectorate",
                "Rohit Verma", "5-B", today.minusDays(120)));
        s.transportAssignments.save(new TransportAssignment("STU-2026-0512", "RT-001", "Sanjay Place",
                "Ananya Verma", "5-B", today.minusDays(120)));

        s.enquiries.save(read("""
                {"studentName":"Ishaan Malhotra","classSought":"5","parentName":"Vikram Malhotra",
                 "phone":"+91 99000 12345","email":"vikram.m@example.com","source":"Website","notes":"Moving from Delhi"}""",
                AdmissionEnquiry.class).withSystemFields("ENQ-001", "NEW", today.minusDays(1).atTime(18, 20),
                today.minusDays(1).atTime(18, 20), null));
        s.enquiries.save(read("""
                {"studentName":"Myra Kapoor","classSought":"1","parentName":"Neha Kapoor","phone":"+91 99000 23456",
                 "source":"Walk-in","followUpDate":"%s"}""".formatted(today.plusDays(2)),
                AdmissionEnquiry.class).withSystemFields("ENQ-002", "CONTACTED", today.minusDays(6).atTime(11, 0),
                today.minusDays(4).atTime(12, 0), null));
        s.enquiries.save(read("""
                {"studentName":"Arjun Yadav","classSought":"8","parentName":"Sunil Yadav","phone":"+91 99000 34567",
                 "source":"Referral","notes":"Visited the campus with family"}""",
                AdmissionEnquiry.class).withSystemFields("ENQ-003", "VISITED", today.minusDays(12).atTime(10, 0),
                today.minusDays(3).atTime(16, 0), null));

        s.healthProfiles.save(read("""
                {"heightCm":138,"weightKg":32,"bloodGroup":"B+","visionLeft":"6/6","visionRight":"6/9",
                 "allergies":"Peanuts","emergencyContactName":"Rajesh Verma","emergencyContactPhone":"+91 98765 12345"}""",
                HealthProfile.class).forStudent(SeedData.DEMO_STUDENT_ID, "School nurse", today.minusDays(40).atTime(10, 0)));

        String[][] books = {
                {"BK-001", "Wings of Fire", "A. P. J. Abdul Kalam", "Biography", "3"},
                {"BK-002", "The Story of My Experiments with Truth", "M. K. Gandhi", "Biography", "2"},
                {"BK-003", "Malgudi Days", "R. K. Narayan", "Fiction", "4"},
                {"BK-004", "Panchatantra Stories", "Vishnu Sharma", "Fiction", "5"},
                {"BK-005", "NCERT Mathematics Class 5", "NCERT", "Textbook", "10"},
                {"BK-006", "Godan", "Munshi Premchand", "Hindi", "2"},
                {"BK-007", "A Brief History of Time", "Stephen Hawking", "Science", "2"},
                {"BK-008", "The Jungle Book", "Rudyard Kipling", "Fiction", "3"}};
        for (String[] b : books) {
            int copies = Integer.parseInt(b[4]);
            s.books.save(new Book(b[0], b[1], b[2], null, b[3], "Shelf " + b[3].charAt(0), copies,
                    b[0].equals("BK-003") ? copies - 1 : copies));
        }
        s.bookIssues.save(new BookIssue("ISS-001", "BK-003", "Malgudi Days", SeedData.DEMO_STUDENT_ID, "Rohit Verma",
                "STUDENT", "5-B", today.minusDays(20), today.minusDays(6), null, 0, "Librarian"));

        s.albums.save(new Album("ALB-001", "Independence Day 2026", LocalDate.of(2026, 8, 15),
                "Flag hoisting, march past and cultural programme.", List.of(), "admin-001"));
    }

    private static <T> T read(String json, Class<T> type) {
        try {
            return JSON.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Bad demo data: " + e.getOriginalMessage(), e);
        }
    }
}
