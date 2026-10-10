package com.ssa.schoolerp.service;

import com.ssa.schoolerp.dto.AccountDtos.CreateAccountRequest;
import com.ssa.schoolerp.dto.AccountDtos.ParentRequest;
import com.ssa.schoolerp.dto.AccountDtos.TemporaryPassword;
import com.ssa.schoolerp.dto.OperationsDtos.CreatedLogin;
import com.ssa.schoolerp.dto.OperationsDtos.ImportRequest;
import com.ssa.schoolerp.dto.OperationsDtos.ImportResult;
import com.ssa.schoolerp.dto.OperationsDtos.ImportRowResult;
import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.Guardian;
import com.ssa.schoolerp.model.Parent;
import com.ssa.schoolerp.model.Role;
import com.ssa.schoolerp.model.SchoolClass;
import com.ssa.schoolerp.model.Student;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Admits many students at once from a spreadsheet saved as CSV. Always check with a dry run first: it validates
 * every row without saving anything. The real run admits the valid rows (billing them like a normal admission),
 * links or creates the parent from the guardian's phone/email, and can create logins.
 */
@Service
@Transactional
public class ImportService {

    /** Columns, in the order of the downloadable template. Only name and class are required. */
    public static final List<String> COLUMNS = List.of("name", "class", "roll", "gender", "date of birth",
            "blood group", "email", "address", "admission date", "guardian name", "guardian relation", "guardian phone",
            "guardian email");

    private static final int MAX_ROWS = 2000;
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("d/M/uuuu"), DateTimeFormatter.ofPattern("d-M-uuuu"),
            DateTimeFormatter.ofPattern("d.M.uuuu"));

    private record Row(int line, Student student, String parentRelation) {
    }

    private final DataStore store;
    private final SchoolService school;
    private final AccountService accounts;
    private final Clock clock;

    public ImportService(DataStore store, SchoolService school, AccountService accounts, Clock clock) {
        this.store = store;
        this.school = school;
        this.accounts = accounts;
        this.clock = clock;
    }

    public String template() {
        return String.join(",", COLUMNS) + "\n"
                + "Aarav Sharma,5-B,,Male,2015-04-12,B+,,\"12 MG Road, Agra\",2026-04-01,Rakesh Sharma,Father,9876543210,rakesh@example.com\n";
    }

    public ImportResult importStudents(ImportRequest request) {
        List<List<String>> lines = parseCsv(request.csv());
        if (lines.isEmpty()) {
            throw ApiErrors.badRequest("The file is empty");
        }
        Map<String, Integer> header = header(lines.get(0));
        if (!header.containsKey("name") || !header.containsKey("class")) {
            throw ApiErrors.badRequest("The first row must be the column headings, with at least \"name\" and \"class\". "
                    + "Download the template to see all columns.");
        }
        if (lines.size() - 1 > MAX_ROWS) {
            throw ApiErrors.badRequest("Import at most " + MAX_ROWS + " students at a time");
        }

        Set<String> classes = store.classes.stream().map(SchoolClass::id).collect(Collectors.toSet());
        Map<String, Set<Integer>> usedRolls = new HashMap<>();
        List<ImportRowResult> results = new ArrayList<>();
        List<Row> valid = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {
            List<String> cells = lines.get(i);
            if (cells.stream().allMatch(String::isBlank)) continue;
            String name = cell(cells, header, "name");
            try {
                Row row = parseRow(i + 1, cells, header, classes, usedRolls);
                valid.add(row);
                results.add(new ImportRowResult(i + 1, name, "OK", null, null));
            } catch (IllegalArgumentException e) {
                results.add(new ImportRowResult(i + 1, name, "ERROR", e.getMessage(), null));
            }
        }
        if (request.dryRun()) {
            return new ImportResult(true, results.size(), valid.size(), 0, results.size() - valid.size(), results,
                    List.of());
        }

        List<CreatedLogin> logins = new ArrayList<>();
        Map<Integer, String> createdIds = new HashMap<>();
        for (Row row : valid) {
            Student created = school.createStudent(row.student());
            createdIds.put(row.line(), created.id());
            if (request.createLogins()) {
                TemporaryPassword login = accounts.create(new CreateAccountRequest(Role.STUDENT, created.id(),
                        freeLogin(created.id())));
                logins.add(new CreatedLogin(created.name(), login.account().loginId(), login.temporaryPassword()));
            }
            linkParent(created, row.parentRelation(), request.createLogins(), logins);
        }
        List<ImportRowResult> finalRows = results.stream()
                .map(r -> createdIds.containsKey(r.row())
                        ? new ImportRowResult(r.row(), r.name(), "CREATED", null, createdIds.get(r.row()))
                        : r)
                .toList();
        return new ImportResult(false, results.size(), valid.size(), createdIds.size(),
                results.size() - valid.size(), finalRows, logins);
    }

    private Row parseRow(int line, List<String> cells, Map<String, Integer> header, Set<String> classes,
                         Map<String, Set<Integer>> usedRolls) {
        String name = required(cell(cells, header, "name"), "Name");
        String className = normalizeClass(required(cell(cells, header, "class"), "Class"));
        if (!classes.contains(className)) {
            throw new IllegalArgumentException("Class " + className + " does not exist");
        }
        Integer roll = null;
        String rollText = cell(cells, header, "roll");
        if (!rollText.isBlank()) {
            try {
                roll = Integer.parseInt(rollText.trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Roll number must be a number");
            }
            if (roll <= 0) throw new IllegalArgumentException("Roll number must be positive");
            Set<Integer> used = usedRolls.computeIfAbsent(className, c -> store.studentsOf(c).stream()
                    .map(Student::rollNumber).collect(Collectors.toCollection(HashSet::new)));
            if (!used.add(roll)) {
                throw new IllegalArgumentException("Roll number " + roll + " is already used in class " + className);
            }
        }
        String gender = normalizeGender(cell(cells, header, "gender"));
        LocalDate dob = date(cell(cells, header, "date of birth"), "Date of birth");
        if (dob != null && !dob.isBefore(LocalDate.now(clock))) {
            throw new IllegalArgumentException("Date of birth must be in the past");
        }
        String email = email(cell(cells, header, "email"), "Email");
        LocalDate admission = date(cell(cells, header, "admission date"), "Admission date");
        String guardianName = cell(cells, header, "guardian name");
        String guardianPhone = cell(cells, header, "guardian phone");
        String guardianEmail = email(cell(cells, header, "guardian email"), "Guardian email");
        String relation = cell(cells, header, "guardian relation");
        Guardian guardian = guardianName.isBlank() ? null
                : new Guardian(guardianName.trim(), blankToNull(relation), blankToNull(guardianPhone), guardianEmail);
        if (guardian == null && (!guardianPhone.isBlank() || guardianEmail != null)) {
            throw new IllegalArgumentException("Guardian name is missing");
        }
        Student student = new Student(null, name, className, roll, gender, dob,
                blankToNull(cell(cells, header, "blood group")), email, blankToNull(cell(cells, header, "address")),
                admission != null ? admission : LocalDate.now(clock), guardian);
        return new Row(line, student, blankToNull(relation));
    }

    /** Adds the student to the parent with the guardian's email or phone, or creates that parent. */
    private void linkParent(Student student, String relation, boolean createLogins, List<CreatedLogin> logins) {
        Guardian g = student.guardian();
        if (g == null || (g.phone() == null && g.email() == null)) return;
        Parent existing = store.parents.stream()
                .filter(p -> (g.email() != null && g.email().equalsIgnoreCase(p.email()))
                        || (g.phone() != null && g.phone().equals(p.phone())))
                .findFirst()
                .orElse(null);
        if (existing != null) {
            List<String> children = new ArrayList<>(existing.childIds());
            children.add(student.id());
            accounts.updateParent(existing.id(), new ParentRequest(existing.name(), existing.email(), existing.phone(),
                    existing.relation(), children));
            return;
        }
        Parent created = accounts.createParent(new ParentRequest(g.name(), g.email(), g.phone(), relation,
                List.of(student.id())));
        if (createLogins) {
            TemporaryPassword login = accounts.create(new CreateAccountRequest(Role.PARENT, created.id(),
                    freeLogin(created.email(), created.phone(), created.id())));
            logins.add(new CreatedLogin(created.name() + " (parent)", login.account().loginId(),
                    login.temporaryPassword()));
        }
    }

    /** The first candidate no other login uses (the last one, an id, is always free). */
    private String freeLogin(String... candidates) {
        for (String c : candidates) {
            if (c == null || c.isBlank()) continue;
            String login = c.trim().toLowerCase(Locale.ROOT);
            if (store.accounts.where("lower(e.loginId) = ?1 or lower(e.profileId) = ?1", login).isEmpty()) {
                return login;
            }
        }
        return candidates[candidates.length - 1];
    }

    // ---------------------------------------------------------------- parsing helpers

    private static Map<String, Integer> header(List<String> cells) {
        Map<String, Integer> header = new HashMap<>();
        for (int i = 0; i < cells.size(); i++) {
            String key = cells.get(i).trim().toLowerCase(Locale.ROOT).replace('_', ' ').replaceAll("\\s+", " ");
            key = switch (key) {
                case "student name", "full name" -> "name";
                case "class name", "class-section", "grade" -> "class";
                case "roll no", "roll number", "roll no." -> "roll";
                case "dob", "birth date" -> "date of birth";
                case "parent name", "father name", "father's name" -> "guardian name";
                case "parent phone", "mobile", "phone", "contact" -> "guardian phone";
                case "parent email" -> "guardian email";
                case "relation" -> "guardian relation";
                default -> key;
            };
            header.putIfAbsent(key, i);
        }
        return header;
    }

    private static String cell(List<String> cells, Map<String, Integer> header, String column) {
        Integer index = header.get(column);
        return index == null || index >= cells.size() ? "" : cells.get(index).trim();
    }

    private static String required(String value, String label) {
        if (value.isBlank()) throw new IllegalArgumentException(label + " is missing");
        return value.trim();
    }

    /** "5b", "5 B", "5-b" → "5-B". */
    static String normalizeClass(String value) {
        String compact = value.trim().toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "");
        return compact.replaceFirst("^(\\d+)([A-Z]+)$", "$1-$2");
    }

    private static String normalizeGender(String value) {
        if (value.isBlank()) return null;
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "m", "male", "boy" -> "Male";
            case "f", "female", "girl" -> "Female";
            case "o", "other" -> "Other";
            default -> throw new IllegalArgumentException("Gender must be Male, Female or Other");
        };
    }

    private static LocalDate date(String value, String label) {
        if (value.isBlank()) return null;
        for (DateTimeFormatter format : DATE_FORMATS) {
            try {
                return LocalDate.parse(value.trim(), format);
            } catch (DateTimeParseException ignored) {
                // try the next format
            }
        }
        throw new IllegalArgumentException(label + " \"" + value + "\" is not a date (use YYYY-MM-DD or DD/MM/YYYY)");
    }

    private static String email(String value, String label) {
        if (value.isBlank()) return null;
        if (!EMAIL.matcher(value.trim()).matches()) {
            throw new IllegalArgumentException(label + " \"" + value + "\" is not a valid email");
        }
        return value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** RFC 4180 CSV: quoted fields may contain commas, newlines and doubled quotes. A leading BOM is ignored. */
    static List<List<String>> parseCsv(String text) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        String s = text.startsWith("﻿") ? text.substring(1) : text;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (quoted) {
                if (c == '"') {
                    if (i + 1 < s.length() && s.charAt(i + 1) == '"') {
                        field.append('"');
                        i++;
                    } else {
                        quoted = false;
                    }
                } else {
                    field.append(c);
                }
            } else if (c == '"') {
                quoted = true;
            } else if (c == ',') {
                row.add(field.toString());
                field.setLength(0);
            } else if (c == '\n' || c == '\r') {
                if (c == '\r' && i + 1 < s.length() && s.charAt(i + 1) == '\n') i++;
                row.add(field.toString());
                field.setLength(0);
                rows.add(row);
                row = new ArrayList<>();
            } else {
                field.append(c);
            }
        }
        if (field.length() > 0 || !row.isEmpty()) {
            row.add(field.toString());
            rows.add(row);
        }
        return rows;
    }
}
