package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.OperationsDtos.AdmitCard;
import com.ssa.schoolerp.dto.OperationsDtos.AdmitCards;
import com.ssa.schoolerp.dto.OperationsDtos.Room;
import com.ssa.schoolerp.dto.OperationsDtos.RoomPlan;
import com.ssa.schoolerp.dto.OperationsDtos.SeatView;
import com.ssa.schoolerp.dto.OperationsDtos.SeatingPlan;
import com.ssa.schoolerp.dto.OperationsDtos.SeatingRequest;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Exam;
import com.ssa.schoolerp.model.ExamSchedule;
import com.ssa.schoolerp.model.ExamSeat;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Exam-hall seating and admit cards. Seats alternate between classes (so neighbours sit different papers), filling
 * the rooms in the order given.
 */
@Service
@Transactional
public class ExamSeatingService {

    private final DataStore store;
    private final AccessGuard guard;
    private final SettingsService settings;

    public ExamSeatingService(DataStore store, AccessGuard guard, SettingsService settings) {
        this.store = store;
        this.guard = guard;
        this.settings = settings;
    }

    public SeatingPlan arrange(String examId, SeatingRequest request) {
        Exam exam = store.exams.getById(examId);
        List<String> classes = request.classes() == null || request.classes().isEmpty()
                ? exam.classes()
                : request.classes().stream().filter(exam.classes()::contains).toList();
        if (classes.isEmpty()) {
            throw ApiErrors.badRequest("None of those classes sit this exam");
        }
        Set<String> rooms = new HashSet<>();
        for (Room room : request.rooms()) {
            if (!rooms.add(room.room().trim().toLowerCase())) {
                throw ApiErrors.badRequest("Room " + room.room() + " is listed twice");
            }
        }

        // One queue per class; take one student from each class in turn.
        List<Deque<Student>> queues = classes.stream()
                .map(c -> (Deque<Student>) new ArrayDeque<>(store.studentsOf(c)))
                .filter(q -> !q.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
        List<Student> order = new ArrayList<>();
        while (!queues.isEmpty()) {
            for (var it = queues.iterator(); it.hasNext(); ) {
                Deque<Student> q = it.next();
                order.add(q.poll());
                if (q.isEmpty()) it.remove();
            }
        }
        int capacity = request.rooms().stream().mapToInt(Room::capacity).sum();
        if (capacity < order.size()) {
            throw ApiErrors.badRequest("The rooms seat " + capacity + " but " + order.size()
                    + " students sit this exam; add rooms or capacity");
        }

        List<ExamSeat> seats = new ArrayList<>();
        int next = 0;
        for (Room room : request.rooms()) {
            for (int seat = 1; seat <= room.capacity() && next < order.size(); seat++) {
                Student s = order.get(next++);
                seats.add(new ExamSeat(examId, s.id(), s.name(), s.className(), s.rollNumber(), room.room().trim(), seat));
            }
        }
        // Re-arranging replaces the seats of these classes; other classes of the exam keep theirs.
        Set<String> replaced = Set.copyOf(classes);
        store.examSeats.where("e.examId = ?1", examId).stream()
                .filter(s -> replaced.contains(s.className()))
                .forEach(s -> store.examSeats.deleteById(s.id()));
        store.examSeats.insertAll(seats);
        return plan(examId, request.rooms());
    }

    public SeatingPlan plan(String examId) {
        return plan(examId, null);
    }

    public void clear(String examId) {
        store.exams.getById(examId);
        store.examSeats.where("e.examId = ?1", examId).forEach(s -> store.examSeats.deleteById(s.id()));
    }

    /**
     * Admit cards for a class (teacher of the class, admin) or one student (the student, their parent).
     * Each card lists the student's papers and, when seating is arranged, their room and seat.
     */
    public AdmitCards admitCards(User user, String examId, String className, String studentId) {
        Exam exam = store.exams.getById(examId);
        List<Student> students;
        String cls;
        if (studentId != null) {
            Student s = guard.checkStudentAccess(user, studentId);
            students = List.of(s);
            cls = s.className();
        } else if (className != null) {
            guard.checkCanManageClass(user, className);
            students = store.studentsOf(className);
            cls = className;
        } else {
            throw ApiErrors.badRequest("Choose a class or a student");
        }
        if (!exam.classes().contains(cls)) {
            throw ApiErrors.badRequest("Class " + cls + " does not sit " + exam.name());
        }
        List<ExamSchedule> papers = store.schedules.where("e.examId = ?1 and e.className = ?2", examId, cls).stream()
                .sorted(Comparator.comparing(ExamSchedule::date).thenComparing(ExamSchedule::startTime,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        Map<String, ExamSeat> seats = store.examSeats.where("e.examId = ?1 and e.className = ?2", examId, cls).stream()
                .collect(Collectors.toMap(ExamSeat::studentId, Function.identity()));
        List<AdmitCard> cards = students.stream()
                .map(s -> {
                    ExamSeat seat = seats.get(s.id());
                    return new AdmitCard(s, seat == null ? null : seat.room(), seat == null ? null : seat.seatNumber(),
                            papers);
                })
                .toList();
        return new AdmitCards(settings.get(), exam, cls, cards);
    }

    private SeatingPlan plan(String examId, List<Room> roomOrder) {
        Exam exam = store.exams.getById(examId);
        List<ExamSeat> seats = store.examSeats.where("e.examId = ?1", examId);
        Map<String, List<ExamSeat>> byRoom = new LinkedHashMap<>();
        if (roomOrder != null) {
            roomOrder.forEach(r -> byRoom.put(r.room().trim(), new ArrayList<>()));
        }
        seats.stream()
                .sorted(Comparator.comparing(ExamSeat::room).thenComparingInt(ExamSeat::seatNumber))
                .forEach(s -> byRoom.computeIfAbsent(s.room(), k -> new ArrayList<>()).add(s));
        Map<String, Integer> capacities = roomOrder == null ? Map.of()
                : roomOrder.stream().collect(Collectors.toMap(r -> r.room().trim(), Room::capacity, (a, b) -> a));
        List<RoomPlan> rooms = byRoom.entrySet().stream()
                .map(e -> new RoomPlan(e.getKey(), capacities.getOrDefault(e.getKey(), e.getValue().size()),
                        e.getValue().stream()
                                .sorted(Comparator.comparingInt(ExamSeat::seatNumber))
                                .map(s -> new SeatView(s.seatNumber(), s.studentId(), s.studentName(), s.className(),
                                        s.rollNumber()))
                                .toList()))
                .toList();
        return new SeatingPlan(examId, exam.name(), seats.size(), rooms);
    }
}
