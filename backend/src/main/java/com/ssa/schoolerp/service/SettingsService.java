package com.ssa.schoolerp.service;

import com.ssa.schoolerp.model.ReferenceData;
import com.ssa.schoolerp.model.SchoolSettings;
import com.ssa.schoolerp.repository.DataStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SettingsService {

    private final DataStore store;

    public SettingsService(DataStore store) {
        this.store = store;
    }

    public SchoolSettings get() {
        return store.settings.findById(SchoolSettings.ID).orElseGet(() -> store.settings.save(
                new SchoolSettings("School", null, null, null, "CBSE", null, null, null, ReferenceData.ACADEMIC_YEAR)));
    }

    public SchoolSettings update(SchoolSettings request) {
        return store.settings.save(new SchoolSettings(request.schoolName().trim(), request.address(), request.phone(),
                request.email(), request.board(), request.affiliationNo(), request.udiseCode(), request.principalName(),
                request.currentAcademicYear()));
    }

    public String currentAcademicYear() {
        return get().currentAcademicYear();
    }

    /** The given year, or the current one when blank. */
    public String yearOr(String academicYear) {
        return academicYear == null || academicYear.isBlank() ? currentAcademicYear() : academicYear;
    }
}
