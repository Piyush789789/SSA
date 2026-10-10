import React, { useState } from 'react';
import { X, Building2, BookOpen } from 'lucide-react';
import { useI18n } from '@/i18n/translate';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = (teacher) => ({
  name: teacher?.name || '',
  email: teacher?.email || '',
  phone: teacher?.phone || '',
  qualification: teacher?.qualification || '',
  experience: teacher?.experience || '',
  joiningDate: teacher?.joiningDate || '',
  subjects: teacher?.subjects ? [...teacher.subjects] : [],
  assignedClasses: teacher?.assignedClasses ? [...teacher.assignedClasses] : [],
});

const Chip = ({ selected, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
      selected
        ? 'bg-[#FF6B2C] text-white border border-[#FF6B2C] shadow-xs'
        : 'bg-white text-slate-700 border border-orange-200 hover:border-orange-300'
    }`}
  >
    {children}
  </button>
);

/**
 * Add / edit a teacher. `onSave(data)` returns a promise (POST/PUT /teachers); its error message is shown.
 * Subjects come from GET /meta, classes from GET /classes.
 */
export const TeacherFormModal = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  // Remount per teacher so the form starts from that teacher's values.
  return <TeacherForm key={props.teacherToEdit?.id || 'new'} {...props} />;
};

const TeacherForm = ({ teacherToEdit, subjectOptions, classOptions, optionsError, onClose, onSave }) => {
  const { tx } = useI18n();
  const isEditing = Boolean(teacherToEdit);
  const [formData, setFormData] = useState(() => initialForm(teacherToEdit));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const toggle = (field, value) => {
    setFormData((prev) => {
      const list = prev[field];
      return { ...prev, [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!EMAIL_RE.test(formData.email.trim())) newErrors.email = 'Please enter a valid email address.';
    if (formData.subjects.length === 0) newErrors.subjects = 'Select at least one subject.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setServerError('');
    try {
      await onSave({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        qualification: formData.qualification.trim() || null,
        experience: formData.experience.trim() || null,
        joiningDate: formData.joiningDate || null,
        subjects: formData.subjects,
        assignedClasses: formData.assignedClasses,
      });
    } catch (error) {
      setServerError(error.message || 'Could not save the teacher.');
    } finally {
      setSaving(false);
    }
  };

  // Keep values the teacher already has visible even if they are no longer offered.
  const subjects = [...new Set([...subjectOptions, ...formData.subjects])];
  const classes = [...new Set([...classOptions, ...formData.assignedClasses])];

  const textInput = (name, label, placeholder, type = 'text', required = false) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
          errors[name] ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
        }`}
      />
      {errors[name] && <p className="text-xs text-rose-500 font-medium">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900">
            {isEditing ? `Edit Teacher — ${teacherToEdit.id}` : tx('Add New Teacher')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-1">
          {serverError && (
            <div className="bg-rose-50 text-rose-700 text-xs font-medium p-3 rounded-xl border border-rose-200">
              {serverError}
            </div>
          )}
          {optionsError && (
            <div className="bg-amber-50 text-amber-800 text-xs font-medium p-3 rounded-xl border border-amber-200">
              Could not load subject/class options: {optionsError.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {textInput('name', 'Full Name', 'Full name', 'text', true)}
            {textInput('email', 'Email', 'Email', 'email', true)}
            {textInput('phone', 'Phone', 'Phone', 'tel')}
            {textInput('qualification', 'Qualification', 'e.g. BSc, MSc, B.Ed')}
            {textInput('experience', 'Experience', 'e.g. 5 years')}
            {textInput('joiningDate', 'Joining Date', '', 'date')}
          </div>

          {/* Subjects */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FF6B2C]" />
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subjects <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className={`p-4 rounded-2xl border bg-slate-50/50 ${errors.subjects ? 'border-rose-300' : 'border-slate-200/80'}`}>
              {subjects.length === 0 ? (
                <p className="text-xs text-slate-400">Loading subjects…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subj) => (
                    <Chip key={subj} selected={formData.subjects.includes(subj)} onClick={() => toggle('subjects', subj)}>
                      {subj}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
            {errors.subjects && <p className="text-xs text-rose-500 font-medium">{errors.subjects}</p>}
          </div>

          {/* Assign Classes Area */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#FF6B2C]" />
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assign Classes
              </label>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50">
              {classes.length === 0 ? (
                <p className="text-xs text-slate-400">No classes available.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => (
                    <Chip
                      key={cls}
                      selected={formData.assignedClasses.includes(cls)}
                      onClick={() => toggle('assignedClasses', cls)}
                    >
                      {cls}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              {tx('Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer"
            >
              {saving ? tx('Saving…') : tx(isEditing ? 'Save Changes' : 'Add Teacher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
