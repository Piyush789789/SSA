/** Classes a family can ask for (classSought is free text on the server, ≤ 20 characters). */
export const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
export const GENDERS = ['Male', 'Female', 'Other'];
export const SOURCES = ['Walk-in', 'Phone', 'Referral', 'Social media', 'Newspaper', 'Website', 'Other'];
export const STATUSES = ['NEW', 'CONTACTED', 'VISITED', 'APPLIED', 'ADMITTED', 'CLOSED'];

export const emptyEnquiry = () => ({
  studentName: '',
  dateOfBirth: '',
  gender: '',
  classSought: '',
  parentName: '',
  phone: '',
  email: '',
  address: '',
  previousSchool: '',
  notes: '',
  source: 'Walk-in',
});

export const enquiryToForm = (e) => ({
  studentName: e.studentName ?? '',
  dateOfBirth: e.dateOfBirth ?? '',
  gender: e.gender ?? '',
  classSought: e.classSought ?? '',
  parentName: e.parentName ?? '',
  phone: e.phone ?? '',
  email: e.email ?? '',
  address: e.address ?? '',
  previousSchool: e.previousSchool ?? '',
  notes: e.notes ?? '',
  source: e.source ?? '',
});

const PHONE_RE = /^[+0-9 ()-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Client-side checks mirroring the server's rules. Returns an error text or ''. */
export const validateEnquiry = (form, t) => {
  if (!form.studentName.trim()) return t('admissions.errStudent');
  if (!form.classSought.trim()) return t('admissions.errClass');
  if (!form.parentName.trim()) return t('admissions.errParent');
  if (!PHONE_RE.test(form.phone.trim())) return t('admissions.errPhone');
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) return t('admissions.errEmail');
  return '';
};

/** Body for POST /enquiries[/public] and PUT /enquiries/{id}; blanks become null. */
export const enquiryBody = (form, extra = {}) => {
  const text = (v) => (v && String(v).trim() ? String(v).trim() : null);
  return {
    studentName: form.studentName.trim(),
    dateOfBirth: form.dateOfBirth || null,
    gender: form.gender || null,
    classSought: form.classSought.trim(),
    parentName: form.parentName.trim(),
    phone: form.phone.trim(),
    email: text(form.email),
    address: text(form.address),
    previousSchool: text(form.previousSchool),
    notes: text(form.notes),
    ...extra,
  };
};
