package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.CampusDtos.AlbumRequest;
import com.ssa.schoolerp.dto.CampusDtos.IdCard;
import com.ssa.schoolerp.dto.CampusDtos.IdCards;
import com.ssa.schoolerp.dto.CampusDtos.PtmBooking;
import com.ssa.schoolerp.dto.CampusDtos.PtmSlotsRequest;
import com.ssa.schoolerp.dto.CampusDtos.VisitRequest;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Album;
import com.ssa.schoolerp.model.HealthProfile;
import com.ssa.schoolerp.model.HealthVisit;
import com.ssa.schoolerp.model.PtmSlot;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.SchoolSettings;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.TransportAssignment;
import com.ssa.schoolerp.model.TransportRoute;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import com.ssa.schoolerp.security.AccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** ID cards, parent-teacher meeting slots, the event photo gallery and student health records. */
@Service
@Transactional
public class CampusService {

    private final DataStore store;
    private final AccessGuard guard;
    private final Clock clock;
    private final SettingsService settings;
    private final FileService files;
    private final NotificationService notifications;

    public CampusService(DataStore store, AccessGuard guard, Clock clock, SettingsService settings, FileService files,
                         NotificationService notifications) {
        this.store = store;
        this.guard = guard;
        this.clock = clock;
        this.settings = settings;
        this.files = files;
        this.notifications = notifications;
    }

    // ---------------------------------------------------------------- ID cards

    /** Cards for a class or one student, or for all teachers ({@code teachers=true}); valid to the end of the year. */
    public IdCards idCards(User user, String className, String studentId, boolean teachers) {
        SchoolSettings school = settings.get();
        String year = school.currentAcademicYear();
        LocalDate validTill = validTill(year);
        Map<String, TransportAssignment> transport = store.transportAssignments.stream()
                .collect(Collectors.toMap(TransportAssignment::id, Function.identity()));
        Map<String, String> routeNames = store.routes.stream()
                .collect(Collectors.toMap(TransportRoute::id, TransportRoute::name));
        List<IdCard> cards = new ArrayList<>();
        if (teachers) {
            if (user.getRole() != Role.ADMIN) throw ApiErrors.forbidden();
            store.teachers.stream().sorted(Comparator.comparing(Teacher::name)).forEach(t -> cards.add(new IdCard(
                    t.id(), t.name(), "Teacher", String.join(", ", t.subjects()), null, null, null, null, t.phone(),
                    null, null, null, null)));
        } else {
            List<Student> students;
            if (studentId != null) {
                students = List.of(guard.checkStudentAccess(user, studentId));
            } else if (className != null) {
                guard.checkCanManageClass(user, className);
                students = store.studentsOf(className);
            } else {
                throw ApiErrors.badRequest("Choose a class or a student");
            }
            for (Student s : students) {
                TransportAssignment t = transport.get(s.id());
                cards.add(new IdCard(s.id(), s.name(), "Student", s.className(), s.rollNumber(), s.dateOfBirth(),
                        s.bloodGroup(), s.guardian() == null ? null : s.guardian().name(),
                        s.guardian() == null ? null : s.guardian().phone(), s.address(), s.photoFileId(),
                        t == null ? null : routeNames.get(t.routeId()), t == null ? null : t.stopName()));
            }
        }
        return new IdCards(school, year, validTill, cards);
    }

    /** Sets the ID-card photo (an uploaded file) of a student. */
    public Student setPhoto(User user, String studentId, String fileId) {
        Student student = store.students.getById(studentId);
        guard.checkCanManageClass(user, student.className());
        files.get(fileId);
        return store.students.save(student.withPhoto(fileId));
    }

    /** "2026-27" → 31 March 2027. */
    private LocalDate validTill(String year) {
        try {
            return LocalDate.of(Integer.parseInt(year.substring(0, 4)) + 1, 3, 31);
        } catch (RuntimeException e) {
            return LocalDate.now(clock).plusYears(1);
        }
    }

    // ---------------------------------------------------------------- PTM

    /** A teacher opens slots of {@code minutes} between from and to. */
    public List<PtmSlot> createSlots(User user, PtmSlotsRequest request) {
        Teacher teacher = guard.teacherOf(user);
        if (request.date().isBefore(LocalDate.now(clock))) {
            throw ApiErrors.badRequest("Choose a date that has not passed");
        }
        if (!request.to().isAfter(request.from())) {
            throw ApiErrors.badRequest("The end time must be after the start time");
        }
        Set<LocalTime> taken = store.ptmSlots.where("e.teacherId = ?1 and e.date = ?2", teacher.id(), request.date())
                .stream().map(PtmSlot::startTime).collect(Collectors.toSet());
        List<PtmSlot> slots = new ArrayList<>();
        for (LocalTime t = request.from(); !t.plusMinutes(request.minutes()).isAfter(request.to());
             t = t.plusMinutes(request.minutes())) {
            if (taken.contains(t)) continue;
            slots.add(new PtmSlot(store.nextId("PTM"), request.title().trim(), teacher.id(), teacher.name(),
                    request.date(), t, t.plusMinutes(request.minutes()), request.location()));
        }
        if (slots.size() > 60) {
            throw ApiErrors.badRequest("That makes more than 60 slots; use longer slots or a shorter time");
        }
        store.ptmSlots.insertAll(slots);
        notifications.notifyClassFamilies(teacher.assignedClasses(), "Parent-teacher meeting: " + request.title(),
                teacher.name() + " has opened meeting slots on " + request.date() + ". Book one in the app.",
                NotificationService.NOTICE, "/ptm");
        return slots;
    }

    /**
     * Teachers: their own slots. Parents: upcoming slots of their children's teachers (free ones, and their own
     * bookings). Admins: all. Ordered by date and time.
     */
    public List<PtmSlot> slots(User user, LocalDate from) {
        LocalDate start = from != null ? from : LocalDate.now(clock);
        List<PtmSlot> slots = switch (user.getRole()) {
            case ADMIN -> store.ptmSlots.where("e.date >= ?1", start);
            case TEACHER -> store.ptmSlots.where("e.teacherId = ?1 and e.date >= ?2", user.getProfileId(), start);
            case PARENT -> {
                Set<String> classes = guard.readableClasses(user);
                List<String> teacherIds = store.teachers.stream()
                        .filter(t -> t.assignedClasses().stream().anyMatch(classes::contains))
                        .map(Teacher::id).toList();
                yield store.ptmSlots.where("e.teacherId in ?1 and e.date >= ?2", teacherIds, start).stream()
                        .filter(s -> !s.isBooked() || user.getProfileId().equals(s.parentId()))
                        .toList();
            }
            case STUDENT -> throw ApiErrors.forbidden();
        };
        return slots.stream()
                .sorted(Comparator.comparing(PtmSlot::date).thenComparing(PtmSlot::startTime)
                        .thenComparing(PtmSlot::teacherName))
                .toList();
    }

    public PtmSlot book(User user, String slotId, PtmBooking booking) {
        PtmSlot slot = store.ptmSlots.getById(slotId);
        Student student = guard.checkStudentAccess(user, booking.studentId());
        Teacher teacher = store.teachers.getById(slot.teacherId());
        if (!teacher.assignedClasses().contains(student.className())) {
            throw ApiErrors.badRequest(teacher.name() + " does not teach " + student.name());
        }
        if (slot.isBooked()) {
            throw ApiErrors.conflict("This slot was just booked by someone else; pick another");
        }
        if (slot.date().isBefore(LocalDate.now(clock))) {
            throw ApiErrors.badRequest("This meeting date has passed");
        }
        boolean already = store.ptmSlots.where("e.teacherId = ?1 and e.date = ?2 and e.studentId = ?3",
                slot.teacherId(), slot.date(), student.id()).stream().findAny().isPresent();
        if (already) {
            throw ApiErrors.conflict("You already have a slot with " + teacher.name() + " that day");
        }
        PtmSlot booked = store.ptmSlots.save(slot.booked(user.getProfileId(), user.getName(), student, booking.note(),
                LocalDateTime.now(clock)));
        notifications.notify(List.of(teacher.id()), "PTM slot booked",
                user.getName() + " (" + student.name() + ", " + student.className() + ") at " + slot.startTime()
                        + " on " + slot.date(), NotificationService.NOTICE, "/ptm");
        return booked;
    }

    /** The parent who booked, the teacher, or an admin frees the slot. */
    public PtmSlot cancelBooking(User user, String slotId) {
        PtmSlot slot = store.ptmSlots.getById(slotId);
        if (!slot.isBooked()) throw ApiErrors.badRequest("This slot is not booked");
        boolean allowed = user.getRole() == Role.ADMIN || user.actorId().equals(slot.teacherId())
                || user.actorId().equals(slot.parentId());
        if (!allowed) throw ApiErrors.forbidden();
        String parentId = slot.parentId();
        PtmSlot freed = store.ptmSlots.save(slot.booked(null, null, null, null, null));
        String other = user.actorId().equals(parentId) ? slot.teacherId() : parentId;
        notifications.notify(List.of(other), "PTM booking cancelled",
                slot.studentName() + " at " + slot.startTime() + " on " + slot.date(), NotificationService.NOTICE,
                "/ptm");
        return freed;
    }

    public void deleteSlot(User user, String slotId) {
        PtmSlot slot = store.ptmSlots.getById(slotId);
        if (user.getRole() != Role.ADMIN && !user.actorId().equals(slot.teacherId())) throw ApiErrors.forbidden();
        if (slot.isBooked()) {
            notifications.notify(List.of(slot.parentId()), "PTM slot cancelled",
                    slot.teacherName() + " cancelled the meeting at " + slot.startTime() + " on " + slot.date()
                            + ". Please book another slot.", NotificationService.NOTICE, "/ptm");
        }
        store.ptmSlots.deleteById(slotId);
    }

    // ---------------------------------------------------------------- gallery

    public List<Album> albums() {
        return store.albums.stream().sorted(Comparator.comparing(Album::eventDate).reversed()).toList();
    }

    public Album createAlbum(User user, AlbumRequest request) {
        List<String> photos = request.photoIds() == null ? List.of() : request.photoIds().stream().distinct().toList();
        files.checkOwnFiles(user, photos);
        return store.albums.save(new Album(store.nextId("ALB"), request.title().trim(), request.eventDate(),
                request.description(), photos, user.actorId()));
    }

    public Album addPhotos(User user, String albumId, List<String> photoIds) {
        Album album = store.albums.getById(albumId);
        checkAlbumOwner(user, album);
        files.checkOwnFiles(user, photoIds);
        List<String> photos = new ArrayList<>(album.photoIds());
        photoIds.stream().filter(id -> !photos.contains(id)).forEach(photos::add);
        if (photos.size() > 300) throw ApiErrors.badRequest("An album can hold at most 300 photos");
        return store.albums.save(new Album(album.id(), album.title(), album.eventDate(), album.description(), photos,
                album.createdBy()));
    }

    public Album removePhoto(User user, String albumId, String photoId) {
        Album album = store.albums.getById(albumId);
        checkAlbumOwner(user, album);
        List<String> photos = new ArrayList<>(album.photoIds());
        photos.remove(photoId);
        return store.albums.save(new Album(album.id(), album.title(), album.eventDate(), album.description(), photos,
                album.createdBy()));
    }

    public void deleteAlbum(User user, String albumId) {
        checkAlbumOwner(user, store.albums.getById(albumId));
        store.albums.deleteById(albumId);
    }

    private static void checkAlbumOwner(User user, Album album) {
        if (user.getRole() != Role.ADMIN && !user.actorId().equals(album.createdBy())) throw ApiErrors.forbidden();
    }

    // ---------------------------------------------------------------- health

    /** Empty profile if nothing was recorded yet. Students, their parents, their teachers and admins. */
    public HealthProfile healthProfile(User user, String studentId) {
        guard.checkStudentAccess(user, studentId);
        return store.healthProfiles.findById(studentId).orElse(HealthProfile.empty(studentId));
    }

    /** Admins, the class teachers, and parents (who know allergies and medicines best) can update it. */
    public HealthProfile saveHealthProfile(User user, String studentId, HealthProfile request) {
        Student student = guard.checkStudentAccess(user, studentId);
        if (user.getRole() == Role.STUDENT) throw ApiErrors.forbidden();
        if (user.getRole() == Role.TEACHER) guard.checkCanManageClass(user, student.className());
        return store.healthProfiles.save(request.forStudent(studentId, user.getName(), LocalDateTime.now(clock)));
    }

    public List<HealthVisit> visits(User user, String studentId) {
        guard.checkStudentAccess(user, studentId);
        return store.healthVisits.where("e.studentId = ?1 order by e.at desc", studentId);
    }

    /** A sick-room visit; the family is told (by SMS too when the child is sent home). */
    public HealthVisit recordVisit(User user, String studentId, VisitRequest request) {
        Student student = store.students.getById(studentId);
        guard.checkCanManageClass(user, student.className());
        HealthVisit visit = store.healthVisits.save(new HealthVisit(store.nextId("HV"), studentId, student.name(),
                LocalDateTime.now(clock), request.complaint().trim(), request.actionTaken(), request.sentHome(),
                user.getName()));
        String body = student.name() + ": " + visit.complaint()
                + (visit.actionTaken() == null || visit.actionTaken().isBlank() ? "" : ". " + visit.actionTaken())
                + (visit.sentHome() ? ". Please collect your child from school." : ".");
        notifications.notifyFamily(student, visit.sentHome() ? "Please collect your child" : "Visited the sick room",
                body, NotificationService.NOTICE, "/health", visit.sentHome());
        return visit;
    }
}
