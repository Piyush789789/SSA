import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, User, GraduationCap, Users, MapPin, Landmark } from 'lucide-react';
import { PhotoUpload } from '@/components/students/PhotoUpload';
import { useI18n } from '@/i18n/translate';
import { normalizePhone } from '@/utils/whatsapp';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AsyncState, ErrorMessage } from '@/components/common/AsyncState';
import { NotFoundCard } from '@/components/students/NotFoundCard';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { todayIso } from '@/utils';
import { ROUTES } from '@/constants/routes';

// Pure UI option lists.
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Other'];
const INDIAN_STATES = [
  'Uttar Pradesh',
  'Delhi (UT)',
  'Haryana',
  'Punjab',
  'Rajasthan',
  'Uttarakhand',
  'Bihar',
  'Madhya Pradesh',
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'West Bengal',
  'Gujarat',
  'Telangana',
  'Other',
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass = (hasError) =>
  `w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
    hasError
      ? 'border-rose-400 focus:ring-rose-200'
      : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
  }`;

const Field = ({ label, required, error, hint, className = '', children }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    {error && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
  </div>
);

const SectionHeader = ({ icon, title, subtitle }) => {
  const SectionIcon = icon;
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
      <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold text-sm">
        <SectionIcon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
};

const emptyForm = (preselectedClass) => {
  const [grade = '', section = ''] = (preselectedClass || '').split('-');
  return {
    fullName: '',
    email: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    rollNumber: '',
    grade,
    section,
    admissionDate: todayIso(),
    parentName: '',
    relationship: 'Father',
    parentPhone: '',
    parentEmail: '',
    address: '',
    city: '',
    state: 'Uttar Pradesh',
    pinCode: '',
    ...emptyGov,
  };
};

// Government records (UDISE+ / APAAR / RTE); all optional.
const SOCIAL_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const emptyGov = { penNumber: '', apaarId: '', rte: false, socialCategory: '', fatherName: '', motherName: '', photoFileId: '' };
const govFromStudent = (s) => ({
  penNumber: s.penNumber || '',
  apaarId: s.apaarId || '',
  rte: Boolean(s.rte),
  socialCategory: s.socialCategory || '',
  fatherName: s.fatherName || '',
  motherName: s.motherName || '',
  photoFileId: s.photoFileId || '',
});

const formFromStudent = (s) => {
  const [grade = '', section = ''] = (s.className || '').split('-');
  return {
    fullName: s.name || '',
    email: s.email || '',
    dob: s.dateOfBirth || '',
    gender: s.gender || '',
    bloodGroup: s.bloodGroup || '',
    rollNumber: s.rollNumber ? String(s.rollNumber) : '',
    grade,
    section,
    admissionDate: s.admissionDate || '',
    parentName: s.guardian?.name || '',
    relationship: s.guardian?.relation || 'Father',
    parentPhone: s.guardian?.phone || '',
    parentEmail: s.guardian?.email || '',
    // The stored address is one line; it is edited as a whole.
    address: s.address || '',
    city: '',
    state: '',
    pinCode: '',
    ...govFromStudent(s),
  };
};

/**
 * Create a student (POST /students) or, with ?edit=<studentId>, edit one (PUT /students/{id}).
 * ?class=5-B preselects the class.
 */
export const AddStudentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [activeSidebarId, setActiveSidebarId] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const classes = useApi('/classes');
  const meta = useApi('/meta');
  const existing = useApi(editId ? `/students/${encodeURIComponent(editId)}` : null);

  const backTo = editId ? `/admin/students/${editId}` : ROUTES.ADMIN_STUDENTS;
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto pb-16">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{editId ? 'Back to Student' : 'Back to Students'}</span>
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {editId ? t('students.edit') : t('students.addNew')}
            </h1>
            <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
              {editId ? `Update the record of ${editId}` : 'Create a new student record'}
            </p>
          </div>

          {editId && existing.error?.status === 404 ? (
            <NotFoundCard
              title="Student not found"
              message={`No student with ID "${editId}" exists.`}
              backLabel="Back to Students"
              onBack={() => navigate(ROUTES.ADMIN_STUDENTS)}
            />
          ) : (
            <AsyncState
              state={editId ? [classes, existing] : [classes]}
              loadingText="Loading form…"
            >
              {([classList, student]) => (
                <StudentForm
                  key={student?.id || 'new'}
                  classList={classList}
                  academicYear={meta.data?.academicYear}
                  student={student || null}
                  preselectedClass={searchParams.get('class')}
                  onCancel={() => navigate(backTo)}
                  onSaved={(saved) => navigate(`/admin/students/${saved.id}`)}
                />
              )}
            </AsyncState>
          )}
        </main>
      </div>
    </div>
  );
};

const StudentForm = ({ classList, academicYear, student, preselectedClass, onCancel, onSaved }) => {
  const { t } = useI18n();
  const isEditing = Boolean(student);
  const [formData, setFormData] = useState(() =>
    student ? formFromStudent(student) : emptyForm(preselectedClass),
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const grades = useMemo(() => {
    const unique = [...new Set(classList.map((c) => String(c.grade)))];
    return unique.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [classList]);

  const sections = useMemo(
    () =>
      classList
        .filter((c) => String(c.grade) === formData.grade)
        .map((c) => c.section)
        .sort(),
    [classList, formData.grade],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'grade' ? { section: '' } : {}),
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.fullName.trim()) e.fullName = 'Full Name is required.';
    if (formData.email && !EMAIL_RE.test(formData.email.trim()))
      e.email = 'Please enter a valid email address.';
    if (!formData.dob) e.dob = 'Date of Birth is required.';
    if (!formData.gender) e.gender = 'Gender is required.';

    if (formData.rollNumber && !(/^\d+$/.test(String(formData.rollNumber).trim()) && Number(formData.rollNumber) > 0))
      e.rollNumber = 'Roll Number must be a whole number above 0.';
    if (!formData.grade) e.grade = 'Class is required.';
    if (!formData.section) e.section = 'Section is required.';
    if (!formData.admissionDate) e.admissionDate = 'Admission Date is required.';

    if (!formData.parentName.trim()) e.parentName = 'Parent / Guardian Name is required.';
    if (!formData.relationship) e.relationship = 'Relationship is required.';
    const digits = formData.parentPhone.replace(/\D/g, '');
    const phone = normalizePhone(formData.parentPhone);
    // Accepts 98765 12345, 098765 12345, +91 98765 12345, 0091 98765 12345 (Indian mobile: starts with 6-9).
    if (!digits) e.parentPhone = 'Parent Phone is required.';
    else if (!phone || !/^91[6-9]\d{9}$/.test(phone))
      e.parentPhone = 'Parent Phone must be a valid 10-digit mobile number.';
    if (formData.parentEmail && !EMAIL_RE.test(formData.parentEmail.trim())) {
      e.parentEmail = 'Please enter a valid parent email address.';
    }

    if (!formData.address.trim()) e.address = 'Address is required.';
    if (!isEditing) {
      if (!formData.city.trim()) e.city = 'City is required.';
      if (!formData.state) e.state = 'State is required.';
      if (!/^\d{6}$/.test(formData.pinCode.trim()))
        e.pinCode = 'PIN Code must contain exactly 6 digits.';
    } else if (formData.pinCode.trim() && !/^\d{6}$/.test(formData.pinCode.trim())) {
      e.pinCode = 'PIN Code must contain exactly 6 digits.';
    }

    if (formData.apaarId.trim() && !/^\d{12}$/.test(formData.apaarId.trim()))
      e.apaarId = 'APAAR ID must be exactly 12 digits.';
    if (formData.penNumber.trim().length > 20) e.penNumber = 'PEN is too long.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildAddress = () => {
    const cityState = [formData.city.trim(), formData.state].filter(Boolean).join(', ');
    const tail = [cityState, formData.pinCode.trim()].filter(Boolean).join(' - ');
    return [formData.address.trim(), tail].filter(Boolean).join(', ');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      name: formData.fullName.trim(),
      className: `${formData.grade}-${formData.section}`,
      rollNumber: formData.rollNumber ? parseInt(formData.rollNumber, 10) : null,
      gender: formData.gender,
      dateOfBirth: formData.dob,
      bloodGroup: formData.bloodGroup || null,
      email: formData.email.trim() || null,
      address: buildAddress(),
      admissionDate: formData.admissionDate,
      guardian: {
        name: formData.parentName.trim(),
        relation: formData.relationship,
        phone: formData.parentPhone.trim(),
        email: formData.parentEmail.trim() || null,
      },
      // Sent as typed: an emptied field ("") clears the saved value; the server stores blanks as empty (null).
      penNumber: formData.penNumber.trim(),
      apaarId: formData.apaarId.trim(),
      rte: formData.rte,
      socialCategory: formData.socialCategory || '',
      fatherName: formData.fatherName.trim(),
      motherName: formData.motherName.trim(),
      photoFileId: formData.photoFileId || '',
    };

    setSaving(true);
    try {
      const saved = isEditing
        ? await http.put(`/students/${encodeURIComponent(student.id)}`, {
            ...payload,
            id: student.id,
          })
        : await http.post('/students', payload);
      onSaved(saved);
    } catch (error) {
      setServerError(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 lg:p-10 space-y-10"
    >
      {serverError && <ErrorMessage error={serverError} />}

      {/* SECTION 1: BASIC INFORMATION */}
      <div className="space-y-6">
        <SectionHeader
          icon={User}
          title="Basic Information"
          subtitle="Personal and contact details of the student"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field
            label="Full Name"
            required
            error={errors.fullName}
            className="md:col-span-2 lg:col-span-1"
          >
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter student's full name"
              className={inputClass(errors.fullName)}
            />
          </Field>

          <Field label="Student Email" error={errors.email}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@example.com"
              className={inputClass(errors.email)}
            />
          </Field>

          <Field label="Date of Birth" required error={errors.dob}>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className={inputClass(errors.dob)}
            />
          </Field>

          <Field label="Gender" required error={errors.gender}>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`${inputClass(errors.gender)} cursor-pointer`}
            >
              <option value="">Select Gender</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Blood Group">
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className={`${inputClass(false)} cursor-pointer`}
            >
              <option value="">Select Blood Group</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* SECTION 2: ACADEMIC INFORMATION */}
      <div className="space-y-6">
        <SectionHeader
          icon={GraduationCap}
          title="Academic Information"
          subtitle="School enrollment, class, and roll details"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field
            label="Student ID"
            hint={isEditing ? 'System ID' : 'Assigned automatically when the student is created'}
          >
            <input
              type="text"
              value={isEditing ? student.id : 'Auto-generated'}
              readOnly
              className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
            />
          </Field>

          <Field
            label="Roll Number"
            error={errors.rollNumber}
            hint="Leave blank to use the next free roll number"
          >
            <input
              type="number"
              min="1"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              placeholder="Auto"
              className={inputClass(errors.rollNumber)}
            />
          </Field>

          <Field label="Class" required error={errors.grade}>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className={`${inputClass(errors.grade)} cursor-pointer`}
            >
              <option value="">Select Class</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Section" required error={errors.section}>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              disabled={!formData.grade}
              className={`${inputClass(errors.section)} cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100`}
            >
              <option value="">{formData.grade ? 'Select Section' : 'Select a class first'}</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Admission Date" required error={errors.admissionDate}>
            <input
              type="date"
              name="admissionDate"
              value={formData.admissionDate}
              onChange={handleChange}
              className={inputClass(errors.admissionDate)}
            />
          </Field>

          <Field label="Academic Year" hint="Current academic year of the school">
            <input
              type="text"
              value={academicYear || '—'}
              readOnly
              className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
            />
          </Field>
        </div>
      </div>

      {/* SECTION 3: PARENT / GUARDIAN INFORMATION */}
      <div className="space-y-6">
        <SectionHeader
          icon={Users}
          title="Parent / Guardian Information"
          subtitle="Primary guardian contact details"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Parent / Guardian Name" required error={errors.parentName}>
            <input
              type="text"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              placeholder="Enter parent's full name"
              className={inputClass(errors.parentName)}
            />
          </Field>

          <Field label="Relationship" required error={errors.relationship}>
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              className={`${inputClass(errors.relationship)} cursor-pointer`}
            >
              {[...new Set([...RELATIONSHIPS, formData.relationship].filter(Boolean))].map(
                (rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field label="Parent Phone" required error={errors.parentPhone}>
            <input
              type="tel"
              name="parentPhone"
              value={formData.parentPhone}
              onChange={handleChange}
              placeholder="Enter 10-digit phone number"
              className={inputClass(errors.parentPhone)}
            />
          </Field>

          <Field label="Parent Email" error={errors.parentEmail}>
            <input
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              placeholder="parent@example.com"
              className={inputClass(errors.parentEmail)}
            />
          </Field>
        </div>
      </div>

      {/* SECTION 4: ADDRESS INFORMATION */}
      <div className="space-y-6">
        <SectionHeader
          icon={MapPin}
          title="Address Information"
          subtitle="Residential address details"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Field label="Address" required error={errors.address} className="md:col-span-3">
            <textarea
              rows={3}
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete residential address"
              className={inputClass(errors.address)}
            />
          </Field>

          <Field label="City" required={!isEditing} error={errors.city}>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder={isEditing ? 'Only if adding to the address' : 'Enter city (e.g. Meerut)'}
              className={inputClass(errors.city)}
            />
          </Field>

          <Field label="State" required={!isEditing} error={errors.state}>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={`${inputClass(errors.state)} cursor-pointer`}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </Field>

          <Field label="PIN Code" required={!isEditing} error={errors.pinCode}>
            <input
              type="text"
              maxLength={6}
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              placeholder="Enter 6-digit PIN code"
              className={inputClass(errors.pinCode)}
            />
          </Field>
        </div>
        <p className="text-[11px] text-slate-400">
          City, state and PIN code are saved as part of the address.
        </p>
      </div>

      {/* SECTION 5: GOVERNMENT RECORDS */}
      <div className="space-y-6">
        <SectionHeader
          icon={Landmark}
          title={t('gov.title')}
          subtitle={t('gov.subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t('gov.pen')} error={errors.penNumber} hint={t('gov.penHint')}>
            <input
              type="text"
              name="penNumber"
              maxLength={20}
              value={formData.penNumber}
              onChange={handleChange}
              placeholder="UDISE+ PEN"
              className={inputClass(errors.penNumber)}
            />
          </Field>
          <Field label={t('gov.apaar')} error={errors.apaarId} hint={t('gov.apaarHint')}>
            <input
              type="text"
              inputMode="numeric"
              name="apaarId"
              // No maxLength: it would cut a pasted "1234 5678 9012" to 12 characters before the spaces are removed.
              value={formData.apaarId}
              onChange={(e) =>
                handleChange({ target: { name: 'apaarId', value: e.target.value.replace(/\D/g, '').slice(0, 12) } })
              }
              placeholder="12-digit APAAR ID"
              className={inputClass(errors.apaarId)}
            />
          </Field>
          <Field label={t('gov.category')}>
            <select
              name="socialCategory"
              value={formData.socialCategory}
              onChange={handleChange}
              className={`${inputClass(false)} cursor-pointer`}
            >
              <option value="">{t('gov.selectCategory')}</option>
              {SOCIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('gov.father')}>
            <input
              type="text"
              name="fatherName"
              maxLength={100}
              value={formData.fatherName}
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>
          <Field label={t('gov.mother')}>
            <input
              type="text"
              name="motherName"
              maxLength={100}
              value={formData.motherName}
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>
          <Field label={t('gov.rte')}>
            <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/30 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rte}
                onChange={(e) => setFormData((prev) => ({ ...prev, rte: e.target.checked }))}
                className="w-4 h-4 accent-[#FF6B2C]"
              />
              <span className="text-sm text-slate-700">{t('gov.rteLabel')}</span>
            </label>
          </Field>
          <Field label={t('gov.photo')} className="md:col-span-2 lg:col-span-3" hint={t('gov.photoHint')}>
            <PhotoUpload
              fileId={formData.photoFileId}
              name={formData.fullName}
              onChange={(id) => setFormData((prev) => ({ ...prev, photoFileId: id }))}
            />
          </Field>
        </div>
        {isEditing && <p className="text-[11px] text-slate-400">{t('gov.blankKeeps')}</p>}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-sm rounded-2xl transition-all cursor-pointer"
        >
          {t('common.cancel')}
        </button>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer"
        >
          {saving ? t('common.saving') : isEditing ? t('common.saveChanges') : t('students.create')}
        </button>
      </div>
    </form>
  );
};

export default AddStudentPage;
