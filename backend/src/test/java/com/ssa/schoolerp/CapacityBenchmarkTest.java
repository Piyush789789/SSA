package com.ssa.schoolerp;

import com.ssa.schoolerp.model.Guardian;
import com.ssa.schoolerp.model.Student;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/** Temporary capacity measurement: grows the school to N students with a year of attendance and times key calls. */
class CapacityBenchmarkTest extends ApiTestSupport {

    private static final String[] STATUSES = {"PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "ABSENT", "LATE"};

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void measure() throws Exception {
        for (int target : new int[]{200, 500, 1000}) {
            store.reset();
            long t0 = System.currentTimeMillis();
            grow(target);
            long rows = jdbc.queryForObject("select count(*) from attendance_record", Long.class);
            System.out.printf("BENCH ===== %d students, %d attendance rows (setup %d s)%n",
                    store.students.count(), rows, (System.currentTimeMillis() - t0) / 1000);

            String admin = admin();
            String teacher = teacher();
            String student = student();
            String from30 = today().minusDays(30).toString();

            time("admin   GET /dashboard", admin, "/api/dashboard");
            time("admin   GET /students", admin, "/api/students");
            time("admin   GET /attendance/summary", admin, "/api/attendance/summary");
            time("admin   GET /attendance (30 days, all)", admin, "/api/attendance?from=" + from30);
            time("admin   GET /fees/overview", admin, "/api/fees/overview");
            time("admin   GET /fees/dues", admin, "/api/fees/dues");
            time("teacher GET /dashboard", teacher, "/api/dashboard");
            time("student GET /dashboard", student, "/api/dashboard");
            time("student GET /attendance (30 days)", student, "/api/attendance?studentId=STU-2026-0503&from=" + from30);
            timePut(teacher);
            concurrent(student, 10, 50);
            System.gc();
            Runtime rt = Runtime.getRuntime();
            System.out.printf("BENCH heap used after run: %d MB%n", (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024));
        }
    }

    private void grow(int target) {
        List<String> classes = new ArrayList<>();
        for (int g = 1; g <= 10; g++) {
            classes.add(g + "-A");
            classes.add(g + "-B");
        }
        int existing = store.students.count();
        List<String> newIds = new ArrayList<>();
        for (int i = 0; i < target - existing; i++) {
            String cls = classes.get(i % classes.size());
            String id = String.format("BENCH-%05d", i);
            store.students.save(new Student(id, "Bench Student " + i, cls, 100 + i, "Male", LocalDate.of(2015, 1, 1),
                    "O+", null, "Bench address", LocalDate.of(2026, 4, 1), new Guardian("Guardian " + i, "Father", "+91", null)));
            newIds.add(id + "|" + cls);
        }
        // Fee dues: 5 heads per new student.
        List<Object[]> dues = new ArrayList<>();
        String[][] heads = {{"FH-ADM", "3200"}, {"FH-Q1", "4500"}, {"FH-Q2", "4500"}, {"FH-EXM", "800"}, {"FH-Q3", "4500"}};
        for (String s : newIds) {
            String id = s.split("\\|")[0];
            for (String[] h : heads) {
                dues.add(new Object[]{"DUE-" + id + "-" + h[0], id, h[0], h[0], Long.parseLong(h[1]), 0L, 0L, LocalDate.of(2026, 7, 20)});
            }
        }
        jdbc.batchUpdate("insert into fee_due (id, student_id, fee_head_id, title, amount, concession, paid, due_date) values (?,?,?,?,?,?,?,?)", dues);
        // A school year of attendance (~200 school days) for every new student.
        List<Object[]> att = new ArrayList<>();
        LocalDate day = today().minusDays(1);
        int schoolDays = 0;
        while (schoolDays < 200) {
            if (day.getDayOfWeek() != DayOfWeek.SUNDAY) {
                for (String s : newIds) {
                    String[] parts = s.split("\\|");
                    att.add(new Object[]{"ATT-" + day + "-" + parts[0], parts[0], parts[1], day,
                            STATUSES[Math.floorMod((parts[0] + day).hashCode(), STATUSES.length)], "07:50 AM", null, "Bench"});
                }
                schoolDays++;
                if (att.size() > 20000) {
                    insertAttendance(att);
                    att.clear();
                }
            }
            day = day.minusDays(1);
        }
        insertAttendance(att);
    }

    private void insertAttendance(List<Object[]> rows) {
        jdbc.batchUpdate("insert into attendance_record (id, student_id, class_name, date, status, check_in_time, remarks, marked_by) values (?,?,?,?,?,?,?,?)", rows);
    }

    private void time(String label, String token, String url) throws Exception {
        getAs(token, url); // warm-up
        long[] ms = new long[5];
        for (int i = 0; i < ms.length; i++) {
            long t = System.nanoTime();
            int status = getAs(token, url).andReturn().getResponse().getStatus();
            ms[i] = (System.nanoTime() - t) / 1_000_000;
            if (status != 200) throw new IllegalStateException(label + " -> HTTP " + status);
        }
        Arrays.sort(ms);
        System.out.printf("BENCH %-42s median %5d ms  (max %d)%n", label, ms[2], ms[4]);
    }

    private void timePut(String teacher) throws Exception {
        List<Map<String, Object>> entries = new ArrayList<>();
        store.studentsOf("5-B").forEach(s -> entries.add(Map.of("studentId", s.id(), "status", "present")));
        Map<String, Object> body = Map.of("className", "5-B", "date", today().toString(), "entries", entries);
        putAs(teacher, "/api/attendance", body);
        long[] ms = new long[5];
        for (int i = 0; i < ms.length; i++) {
            long t = System.nanoTime();
            putAs(teacher, "/api/attendance", body);
            ms[i] = (System.nanoTime() - t) / 1_000_000;
        }
        Arrays.sort(ms);
        System.out.printf("BENCH %-42s median %5d ms  (%d students)%n", "teacher PUT /attendance (one class)", ms[2], entries.size());
    }

    private void concurrent(String token, int threads, int requests) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        long t = System.nanoTime();
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < requests; i++) {
            futures.add(pool.submit(() -> {
                getAs(token, "/api/dashboard");
                return null;
            }));
        }
        for (Future<?> f : futures) f.get();
        pool.shutdown();
        double seconds = (System.nanoTime() - t) / 1e9;
        System.out.printf("BENCH %d student dashboards, %d at a time: %.1f s total = %.1f requests/s%n",
                requests, threads, seconds, requests / seconds);
    }

    private LocalDate today() {
        return LocalDate.now(ZoneId.of("Asia/Kolkata"));
    }
}
