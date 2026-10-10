package com.ssa.schoolerp.service;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Audience;
import com.ssa.schoolerp.model.Notice;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class NoticeService {

    private final DataStore store;
    private final Clock clock;

    public NoticeService(DataStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /** Notices for the user's audience, newest first. Admins and authors see their notices regardless. */
    public List<Notice> visibleTo(User user) {
        return store.notices.stream()
                .filter(n -> user.getRole() == Role.ADMIN || n.audience().includes(user.getRole())
                        || user.actorId().equals(n.authorId()))
                .sorted(Comparator.comparing(Notice::createdAt).reversed().thenComparing(Notice::id))
                .toList();
    }

    public Notice create(User author, Notice request) {
        LocalDate today = LocalDate.now(clock);
        Notice notice = new Notice(store.nextId("NTC"), request.title(), request.description(), priorityOf(request),
                audienceOf(request), author.actorId(), author.getName(), today, today);
        return store.notices.save(notice);
    }

    public Notice update(User user, String id, Notice request) {
        Notice existing = checkCanEdit(user, id);
        Notice notice = new Notice(id, request.title(), request.description(), priorityOf(request), audienceOf(request),
                existing.authorId(), existing.authorName(), existing.createdAt(), LocalDate.now(clock));
        return store.notices.save(notice);
    }

    public void delete(User user, String id) {
        checkCanEdit(user, id);
        store.notices.deleteById(id);
    }

    private Notice checkCanEdit(User user, String id) {
        Notice notice = store.notices.getById(id);
        if (user.getRole() != Role.ADMIN && !user.actorId().equals(notice.authorId())) {
            throw ApiErrors.forbidden();
        }
        return notice;
    }

    private static String priorityOf(Notice request) {
        return request.priority() == null ? "medium" : request.priority();
    }

    private static Audience audienceOf(Notice request) {
        return request.audience() == null ? Audience.ALL : request.audience();
    }
}
