package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.LoginResponse;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.AuthSession;
import com.ssa.schoolerp.model.LoginRequest;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.model.UserAccount;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

/**
 * Logins backed by the user_account table. Passwords are BCrypt hashes; sessions live in the auth_session table
 * (keyed by the SHA-256 of the token) so they survive restarts. Five wrong passwords lock an account for 15 minutes.
 */
@Service
public class AuthService {

    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private static final SecureRandom RANDOM = new SecureRandom();
    // Letters and digits that cannot be confused when read out or copied by hand (no 0/O, 1/l/I).
    private static final char[] TEMP_PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789".toCharArray();

    private final DataStore store;
    private final Clock clock;
    private final Duration sessionTtl;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(DataStore store, Clock clock, @Value("${app.auth.session-ttl:PT8H}") Duration sessionTtl) {
        this.store = store;
        this.clock = clock;
        this.sessionTtl = sessionTtl;
    }

    public LoginResponse login(LoginRequest request) {
        String login = request.getEmail().trim().toLowerCase(Locale.ROOT);
        UserAccount account = findByLogin(login);
        LocalDateTime now = LocalDateTime.now(clock);

        if (account != null && account.lockedUntil() != null && now.isBefore(account.lockedUntil())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many wrong passwords. Try again after " + account.lockedUntil().toLocalTime().withNano(0) + ".");
        }
        // Same message whether the login or the password is wrong, so logins cannot be guessed.
        if (account == null || !passwordEncoder.matches(request.getPassword(), account.passwordHash())) {
            if (account != null) {
                int failures = account.failedAttempts() + 1;
                LocalDateTime lock = failures >= MAX_FAILED_ATTEMPTS ? now.plus(LOCK_DURATION) : null;
                store.accounts.save(account.withLoginResult(lock != null ? 0 : failures, lock, account.lastLoginAt()));
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email/ID or password");
        }
        if (!account.active()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is disabled. Please contact the school office.");
        }
        if (Role.parse(request.getRole()).orElse(null) != account.role()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Selected role does not match this account");
        }

        store.accounts.save(account.withLoginResult(0, null, now));
        store.sessions.deleteWhere(s -> s.expiresAt().isBefore(now)); // tidy up old sessions
        String token = newToken();
        store.sessions.save(new AuthSession(hash(token), account.id(), now, now.plus(sessionTtl)));
        return new LoginResponse(true, "Login successful", token, account.toUser());
    }

    public User getUserByToken(String authHeader) {
        String token = extractToken(authHeader);
        if (token == null) {
            throw ApiErrors.unauthorized();
        }
        AuthSession session = store.sessions.findById(hash(token)).orElseThrow(ApiErrors::unauthorized);
        if (LocalDateTime.now(clock).isAfter(session.expiresAt())) {
            store.sessions.deleteById(session.id());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired, please log in again");
        }
        UserAccount account = store.accounts.findById(session.accountId()).orElseThrow(ApiErrors::unauthorized);
        if (!account.active()) {
            throw ApiErrors.unauthorized();
        }
        return account.toUser();
    }

    public void logout(String authHeader) {
        String token = extractToken(authHeader);
        if (token != null) {
            store.sessions.deleteById(hash(token));
        }
    }

    /** The signed-in user changes their own password; other sessions of the account are signed out. */
    public void changePassword(User user, String currentPassword, String newPassword, String authHeader) {
        UserAccount account = store.accounts.getById(user.getId());
        if (!passwordEncoder.matches(currentPassword, account.passwordHash())) {
            throw ApiErrors.badRequest("The current password is not correct");
        }
        checkStrength(newPassword);
        if (passwordEncoder.matches(newPassword, account.passwordHash())) {
            throw ApiErrors.badRequest("The new password must be different from the current one");
        }
        store.accounts.save(account.withPassword(passwordEncoder.encode(newPassword), false));
        String keep = hash(extractToken(authHeader));
        store.sessions.deleteWhere(s -> s.accountId().equals(account.id()) && !s.id().equals(keep));
    }

    // ---------------------------------------------------------------- used by the admin account management

    public String encode(String password) {
        return passwordEncoder.encode(password);
    }

    /** A random 10-character password the admin hands over; the user must replace it at first login. */
    public String newTemporaryPassword() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(TEMP_PASSWORD_CHARS[RANDOM.nextInt(TEMP_PASSWORD_CHARS.length)]);
        }
        return sb.toString();
    }

    public void signOutEverywhere(String accountId) {
        store.sessions.deleteWhere(s -> s.accountId().equals(accountId));
    }

    public static void checkStrength(String password) {
        if (password == null || password.length() < 8
                || !password.chars().anyMatch(Character::isLetter) || !password.chars().anyMatch(Character::isDigit)) {
            throw ApiErrors.badRequest("Use at least 8 characters with both letters and numbers");
        }
    }

    // ---------------------------------------------------------------- helpers

    /** Accepts the login (email) or the linked record's ID, e.g. a student's admission number. */
    private UserAccount findByLogin(String login) {
        List<UserAccount> matches = store.accounts.where("lower(e.loginId) = ?1 or lower(e.profileId) = ?1", login);
        return matches.isEmpty() ? null : matches.get(0);
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String token) {
        if (token == null) return "";
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String extractToken(String authHeader) {
        if (authHeader == null || !authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }
        String token = authHeader.substring(7).trim();
        return token.isEmpty() ? null : token;
    }
}
