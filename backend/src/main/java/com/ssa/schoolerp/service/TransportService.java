package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.CampusDtos.AssignTransport;
import com.ssa.schoolerp.dto.CampusDtos.RouteView;
import com.ssa.schoolerp.dto.CampusDtos.StudentTransport;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.TransportAssignment;
import com.ssa.schoolerp.model.TransportRoute;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** School buses: routes with stops, and which student rides which route. */
@Service
@Transactional
public class TransportService {

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;

    public TransportService(DataStore store, AccessGuard guard, Clock clock) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
    }

    public List<RouteView> routes() {
        Map<String, List<TransportAssignment>> riders = store.transportAssignments.stream()
                .collect(Collectors.groupingBy(TransportAssignment::routeId));
        return store.routes.stream()
                .sorted(Comparator.comparing(TransportRoute::name))
                .map(r -> {
                    List<TransportAssignment> list = riders.getOrDefault(r.id(), List.of());
                    return new RouteView(r, list.size(), list);
                })
                .toList();
    }

    public TransportRoute create(TransportRoute request) {
        checkStops(request);
        return store.routes.save(request.withId(store.nextId("RT")));
    }

    /** Students at a stop that no longer exists are kept but flagged by the UI (stop name unchanged). */
    public TransportRoute update(String id, TransportRoute request) {
        store.routes.getById(id);
        checkStops(request);
        return store.routes.save(request.withId(id));
    }

    public void delete(String id) {
        store.routes.getById(id);
        if (!store.transportAssignments.where("e.routeId = ?1", id).isEmpty()) {
            throw ApiErrors.conflict("Move the students on this route to another route first");
        }
        store.routes.deleteById(id);
    }

    public TransportAssignment assign(AssignTransport request) {
        Student student = store.students.getById(request.studentId());
        TransportRoute route = store.routes.getById(request.routeId());
        if (route.stops().stream().noneMatch(s -> s.name().equals(request.stopName()))) {
            throw ApiErrors.badRequest("Route " + route.name() + " has no stop \"" + request.stopName() + "\"");
        }
        long riders = store.transportAssignments.where("e.routeId = ?1", route.id()).stream()
                .filter(a -> !a.studentId().equals(student.id())).count();
        if (riders >= route.capacity()) {
            throw ApiErrors.conflict(route.name() + " is full (" + route.capacity() + " seats)");
        }
        return store.transportAssignments.save(new TransportAssignment(student.id(), route.id(), request.stopName(),
                student.name(), student.className(), LocalDate.now(clock)));
    }

    public void unassign(String studentId) {
        store.transportAssignments.getById(studentId);
        store.transportAssignments.deleteById(studentId);
    }

    /** A student's bus, stop and driver (the student, their parent, their teachers, admins). Null if none. */
    public StudentTransport forStudent(User user, String studentId) {
        guard.checkStudentAccess(user, studentId);
        TransportAssignment assignment = store.transportAssignments.findById(studentId).orElse(null);
        if (assignment == null) return null;
        TransportRoute route = store.routes.findById(assignment.routeId()).orElse(null);
        TransportRoute.Stop stop = route == null ? null : route.stops().stream()
                .filter(s -> s.name().equals(assignment.stopName())).findFirst().orElse(null);
        return new StudentTransport(assignment, route, stop);
    }

    private static void checkStops(TransportRoute route) {
        Set<String> names = new HashSet<>();
        for (TransportRoute.Stop stop : route.stops()) {
            if (!names.add(stop.name().trim().toLowerCase())) {
                throw ApiErrors.badRequest("Stop \"" + stop.name() + "\" is listed twice");
            }
        }
    }
}
