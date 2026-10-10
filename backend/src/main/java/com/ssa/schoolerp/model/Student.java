package com.ssa.schoolerp.model;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

@Entity
@JsonFields
public class Student implements Identifiable {

    @Id
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    private String className;

    @Positive
    private Integer rollNumber;

    @Pattern(regexp = "Male|Female|Other")
    private String gender;

    @Past
    private LocalDate dateOfBirth;

    private String bloodGroup;

    @Email
    private String email;

    private String address;
    private LocalDate admissionDate;

    @Valid
    @Embedded
    @AttributeOverride(name = "name", column = @Column(name = "guardian_name"))
    @AttributeOverride(name = "relation", column = @Column(name = "guardian_relation"))
    @AttributeOverride(name = "phone", column = @Column(name = "guardian_phone"))
    @AttributeOverride(name = "email", column = @Column(name = "guardian_email"))
    private Guardian guardian;

    /** Active, Graduated (passed out of class 10) or Left (transfer certificate issued). Null = Active. */
    private String status;

    // ---- government records (UDISE+ / APAAR / RTE) and ID-card photo; all optional

    /** UDISE+ Permanent Education Number (PEN). */
    private String penNumber;

    /** APAAR ID ("One Nation One Student ID"), 12 digits. */
    @Pattern(regexp = "\\d{12}")
    private String apaarId;

    /** Admitted under the RTE 25% quota (free seat). */
    private Boolean rte;

    @Pattern(regexp = "General|OBC|SC|ST|EWS")
    private String socialCategory;

    private String fatherName;
    private String motherName;

    /** {@link StoredFile} id of the passport photo used on the ID card. */
    private String photoFileId;

    public static final String ACTIVE = "Active";
    public static final String GRADUATED = "Graduated";
    public static final String LEFT = "Left";

    /** JPQL condition (alias e) selecting students who are still in school. */
    public static final String ACTIVE_CONDITION = "(e.status is null or e.status = 'Active')";

    protected Student() {
    }

    public Student(String id, String name, String className, Integer rollNumber, String gender, LocalDate dateOfBirth,
                   String bloodGroup, String email, String address, LocalDate admissionDate, Guardian guardian) {
        this(id, name, className, rollNumber, gender, dateOfBirth, bloodGroup, email, address, admissionDate, guardian,
                ACTIVE);
    }

    public Student(String id, String name, String className, Integer rollNumber, String gender, LocalDate dateOfBirth,
                   String bloodGroup, String email, String address, LocalDate admissionDate, Guardian guardian,
                   String status) {
        this.status = status;
        this.id = id;
        this.name = name;
        this.className = className;
        this.rollNumber = rollNumber;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.bloodGroup = bloodGroup;
        this.email = email;
        this.address = address;
        this.admissionDate = admissionDate;
        this.guardian = guardian;
    }

    /** Copies the government-record fields and photo onto a rebuilt copy. */
    private Student carry(Student next) {
        next.penNumber = penNumber;
        next.apaarId = apaarId;
        next.rte = rte;
        next.socialCategory = socialCategory;
        next.fatherName = fatherName;
        next.motherName = motherName;
        next.photoFileId = photoFileId;
        return next;
    }

    /** Fields an older form leaves out (null) keep their saved value. */
    public Student keepingRecordsOf(Student saved) {
        Student next = carry(withStatus(status));
        if (next.penNumber == null) next.penNumber = saved.penNumber;
        if (next.apaarId == null) next.apaarId = saved.apaarId;
        if (next.rte == null) next.rte = saved.rte;
        if (next.socialCategory == null) next.socialCategory = saved.socialCategory;
        if (next.fatherName == null) next.fatherName = saved.fatherName;
        if (next.motherName == null) next.motherName = saved.motherName;
        if (next.photoFileId == null) next.photoFileId = saved.photoFileId;
        return next;
    }

    public Student withPhoto(String fileId) {
        Student next = carry(withStatus(status));
        next.photoFileId = fileId;
        return next;
    }

    public Student withIdAndRollNumber(String newId, int newRollNumber) {
        return carry(new Student(newId, name, className, newRollNumber, gender, dateOfBirth, bloodGroup, email,
                address, admissionDate, guardian, status()));
    }

    public Student withStatus(String newStatus) {
        return carry(new Student(id, name, className, rollNumber, gender, dateOfBirth, bloodGroup, email, address,
                admissionDate, guardian, newStatus));
    }

    public Student withClass(String newClassName, int newRollNumber) {
        return carry(new Student(id, name, newClassName, newRollNumber, gender, dateOfBirth, bloodGroup, email, address,
                admissionDate, guardian, status()));
    }

    public String status() {
        return status == null ? ACTIVE : status;
    }

    public boolean isActive() {
        return ACTIVE.equals(status());
    }

    @Override
    public String id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String className() {
        return className;
    }

    public Integer rollNumber() {
        return rollNumber;
    }

    public String gender() {
        return gender;
    }

    public LocalDate dateOfBirth() {
        return dateOfBirth;
    }

    public String bloodGroup() {
        return bloodGroup;
    }

    public String email() {
        return email;
    }

    public String address() {
        return address;
    }

    public LocalDate admissionDate() {
        return admissionDate;
    }

    public Guardian guardian() {
        return guardian;
    }

    public String penNumber() {
        return penNumber;
    }

    public String apaarId() {
        return apaarId;
    }

    public boolean rte() {
        return Boolean.TRUE.equals(rte);
    }

    public String socialCategory() {
        return socialCategory;
    }

    public String fatherName() {
        return fatherName;
    }

    public String motherName() {
        return motherName;
    }

    public String photoFileId() {
        return photoFileId;
    }
}
