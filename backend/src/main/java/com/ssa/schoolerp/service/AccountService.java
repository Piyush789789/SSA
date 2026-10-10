package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.AccountDtos.AccountView;
import com.ssa.schoolerp.dto.AccountDtos.CreateAccountRequest;
import com.ssa.schoolerp.dto.AccountDtos.ParentRequest;
import com.ssa.schoolerp.dto.AccountDtos.PermissionOption;
import com.ssa.schoolerp.dto.AccountDtos.StaffAccountRequest;
import com.ssa.schoolerp.dto.AccountDtos.StaffRoleRequest;
import com.ssa.schoolerp.model.Permission;
import com.ssa.schoolerp.dto.AccountDtos.TemporaryPassword;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.model.Teacher;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.model.UserAccount;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Admin management of logins and parent records. */
@Service
@Transactional
public class AccountService {

    private final DataStore store;
    private final AuthService auth;
    private final NotificationService notifications;

    public AccountService(DataStore store, AuthService auth, NotificationService notifications) {
        this.store = store;
        this.auth = auth;
        this.notifications = notifications;
    }

    /**
     * "Forgot password" from the login page: the admins get a notification and reset it from Logins & Parents
     * (no SMS/email cost). Says nothing about whether the login exists, so it cannot be used to discover accounts.
     */
    public void requestPasswordReset(String loginId) {
        String login = loginId == null ? "" : loginId.trim().toLowerCase(Locale.ROOT);
        if (login.isEmpty()) return;
        store.accounts.where("lower(e.loginId) = ?1 or lower(e.profileId) = ?1", login).stream()
                .filter(UserAccount::active)
                .findFirst()
                .ifPresent(a -> notifications.notifyAdmins("Password reset requested",
                        a.displayName() + " (" + a.loginId() + ", " + a.role().name().toLowerCase(Locale.ROOT)
                                + ") forgot their password. Reset it in Logins & Parents and give them the new one.",
                        NotificationService.NOTICE, "/admin/accounts"));
    }

    /** Everyone who can log in (optionally one role), with or without a login yet. */
    public List<AccountView> list(Role role) {
        Map<String, UserAccount> byProfile = store.accounts.stream()
                .filter(a -> a.profileId() != null)
                .collect(Collectors.toMap(UserAccount::profileId, Function.identity(), (a, b) -> a));
        List<AccountView> views = new ArrayList<>();
        if (role == null || role == Role.ADMIN) {
            store.accounts.where("e.role = ?1", Role.ADMIN).forEach(a -> views.add(view(a, a.displayName(),
                    a.staffTitle() != null ? a.staffTitle() : a.permissionSet().isEmpty() ? "Administrator" : "Staff")));
        }
        if (role == null || role == Role.TEACHER) {
            store.teachers.stream().forEach(t -> views.add(view(byProfile.get(t.id()), Role.TEACHER, t.id(), t.name(),
                    String.join(", ", t.subjects()))));
        }
        if (role == null || role == Role.STUDENT) {
            store.students.stream().forEach(s -> views.add(view(byProfile.get(s.id()), Role.STUDENT, s.id(), s.name(),
                    "Class " + s.className() + ", Roll " + s.rollNumber())));
        }
        if (role == null || role == Role.PARENT) {
            Map<String, String> studentNames = store.students.stream()
                    .collect(Collectors.toMap(Student::id, Student::name));
            store.parents.stream().forEach(p -> views.add(view(byProfile.get(p.id()), Role.PARENT, p.id(), p.name(),
                    p.childIds().stream().map(id -> studentNames.getOrDefault(id, id)).collect(Collectors.joining(", ")))));
        }
        views.sort(Comparator.comparing(AccountView::role).thenComparing(AccountView::name));
        return views;
    }

    public TemporaryPassword create(CreateAccountRequest request) {
        if (request.role() == Role.ADMIN) {
            throw ApiErrors.badRequest("Admin logins are created on the server, not from the app");
        }
        String profileId = request.profileId();
        if (!store.accounts.where("e.profileId = ?1", profileId).isEmpty()) {
            throw ApiErrors.conflict("This person already has a login; reset the password instead");
        }
        String name;
        String defaultLogin;
        switch (request.role()) {
            case TEACHER -> {
                Teacher t = store.teachers.getById(profileId);
                name = t.name();
                defaultLogin = t.email();
            }
            case STUDENT -> {
                Student s = store.students.getById(profileId);
                name = s.name();
                defaultLogin = s.email();
            }
            case PARENT -> {
                Parent p = store.parents.getById(profileId);
                name = p.name();
                defaultLogin = p.email();
            }
            default -> throw ApiErrors.badRequest("Unknown role");
        }
        String loginId = firstNonBlank(request.loginId(), defaultLogin, profileId).trim().toLowerCase(Locale.ROOT);
        checkLoginFree(loginId, null);
        String password = auth.newTemporaryPassword();
        UserAccount account = store.accounts.save(new UserAccount(store.nextId("ACC"), loginId, auth.encode(password),
                request.role(), profileId, name, true, true, 0, null, null));
        return new TemporaryPassword(viewOf(account), password);
    }

    /** A login for office staff: an admin account limited to the given modules (none = full administrator). */
    public TemporaryPassword createStaff(StaffAccountRequest request) {
        String loginId = request.loginId().trim().toLowerCase(Locale.ROOT);
        checkLoginFree(loginId, null);
        String password = auth.newTemporaryPassword();
        UserAccount account = new UserAccount(store.nextId("ACC"), loginId, auth.encode(password), Role.ADMIN, null,
                request.name().trim(), true, true, 0, null, null)
                .withStaffRole(blankToNull(request.staffTitle()), request.permissions());
        return new TemporaryPassword(viewOf(store.accounts.save(account)), password);
    }

    /** Changes what a staff login may do. Signs them out so the new rights apply at once. */
    public AccountView updateStaffRole(User admin, String accountId, StaffRoleRequest request) {
        UserAccount account = store.accounts.getById(accountId);
        if (account.role() != Role.ADMIN) {
            throw ApiErrors.badRequest("Only staff/admin logins have staff roles");
        }
        boolean limiting = request.permissions() != null && !request.permissions().isEmpty();
        if (admin.getId().equals(accountId) && limiting) {
            throw ApiErrors.badRequest("You cannot limit your own login");
        }
        if (limiting && account.permissionSet().isEmpty() && fullAdminCount() <= 1) {
            throw ApiErrors.badRequest("Keep at least one full administrator");
        }
        UserAccount updated = store.accounts.save(account.withStaffRole(blankToNull(request.staffTitle()),
                request.permissions()));
        auth.signOutEverywhere(accountId);
        return viewOf(updated);
    }

    public List<PermissionOption> permissionOptions() {
        return java.util.Arrays.stream(Permission.values()).map(p -> new PermissionOption(p, p.label())).toList();
    }

    private long fullAdminCount() {
        return store.accounts.where("e.role = ?1 and e.active = true", Role.ADMIN).stream()
                .filter(a -> a.permissionSet().isEmpty()).count();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public TemporaryPassword resetPassword(String accountId) {
        UserAccount account = store.accounts.getById(accountId);
        String password = auth.newTemporaryPassword();
        UserAccount updated = store.accounts.save(account.withPassword(auth.encode(password), true));
        auth.signOutEverywhere(accountId);
        return new TemporaryPassword(viewOf(updated), password);
    }

    public AccountView setActive(User admin, String accountId, boolean active) {
        if (admin.getId().equals(accountId) && !active) {
            throw ApiErrors.badRequest("You cannot disable your own account");
        }
        UserAccount updated = store.accounts.save(store.accounts.getById(accountId).withActive(active));
        if (!active) {
            auth.signOutEverywhere(accountId);
        }
        return viewOf(updated);
    }

    /** Removes the login of a deleted teacher/student/parent. */
    public void deleteForProfile(String profileId) {
        store.accounts.where("e.profileId = ?1", profileId).forEach(a -> {
            auth.signOutEverywhere(a.id());
            store.accounts.deleteById(a.id());
        });
    }

    /** Keeps the name shown for a login in step with the teacher/student/parent record. */
    public void renameForProfile(String profileId, String name) {
        store.accounts.where("e.profileId = ?1", profileId)
                .forEach(a -> store.accounts.save(a.withDisplayName(name)));
    }

    // ---------------------------------------------------------------- parents

    public List<Parent> parents() {
        return store.parents.stream().sorted(Comparator.comparing(Parent::name)).toList();
    }

    public Parent createParent(ParentRequest request) {
        List<String> children = checkChildren(request.childIds());
        return store.parents.save(new Parent(store.nextId("PRN"), request.name().trim(), request.email(), request.phone(),
                request.relation(), children));
    }

    public Parent updateParent(String id, ParentRequest request) {
        store.parents.getById(id);
        List<String> children = checkChildren(request.childIds());
        Parent saved = store.parents.save(new Parent(id, request.name().trim(), request.email(), request.phone(),
                request.relation(), children));
        renameForProfile(id, saved.name());
        return saved;
    }

    public void deleteParent(String id) {
        store.parents.getById(id);
        deleteForProfile(id);
        store.parents.deleteById(id);
    }

    private List<String> checkChildren(List<String> childIds) {
        List<String> children = childIds == null ? List.of() : childIds.stream().distinct().toList();
        children.forEach(store.students::getById);
        return children;
    }

    // ---------------------------------------------------------------- helpers

    private void checkLoginFree(String loginId, String ownAccountId) {
        boolean taken = store.accounts.where("lower(e.loginId) = ?1 or lower(e.profileId) = ?1", loginId).stream()
                .anyMatch(a -> !a.id().equals(ownAccountId));
        if (taken) {
            throw ApiErrors.conflict("The login " + loginId + " is already used by another account");
        }
    }

    private AccountView viewOf(UserAccount a) {
        return view(a, a.displayName(), null);
    }

    private static AccountView view(UserAccount a, String name, String detail) {
        return new AccountView(a.id(), a.loginId(), a.role(), a.profileId(), name, detail, a.active(),
                a.mustChangePassword(), a.lastLoginAt(), a.staffTitle(), a.permissionSet());
    }

    private static AccountView view(UserAccount a, Role role, String profileId, String name, String detail) {
        return a == null
                ? new AccountView(null, null, role, profileId, name, detail, false, false, null, null, java.util.Set.of())
                : new AccountView(a.id(), a.loginId(), role, profileId, name, detail, a.active(), a.mustChangePassword(),
                a.lastLoginAt(), a.staffTitle(), a.permissionSet());
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        throw ApiErrors.badRequest("A login ID is required");
    }
}
