import React, { useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { http } from '@/api/http';
import { useI18n } from '@/i18n/translate';

const NONE = [];

const emptyForm = (examTypes, academicYear) => ({
  name: '',
  type: examTypes[0] || '',
  academicYear: academicYear || '',
  startDate: '',
  endDate: '',
  selectedClasses: [],
  description: '',
});

/**
 * Create or edit an exam. Saves through the API itself and hands the saved exam to `onSaved`.
 * `classes` are class ids ("5-B"), `examTypes` and `academicYear` come from GET /meta.
 */
export const CreateExamModal = ({
  isOpen,
  onClose,
  onSaved,
  examToEdit = null,
  classes = NONE,
  examTypes = NONE,
  academicYear = '',
}) => {
  const { tx } = useI18n();
  const isEditing = Boolean(examToEdit);
  const [formData, setFormData] = useState(() => emptyForm(examTypes, academicYear));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (examToEdit) {
      setFormData({
        name: examToEdit.name || '',
        type: examToEdit.type || examTypes[0] || '',
        academicYear: examToEdit.academicYear || academicYear || '',
        startDate: examToEdit.startDate || '',
        endDate: examToEdit.endDate || '',
        selectedClasses: examToEdit.classes || [],
        description: examToEdit.description || '',
      });
    } else {
      setFormData(emptyForm(examTypes, academicYear));
    }
    setErrors({});
    setServerError('');
    setSaving(false);
  }, [isOpen, examToEdit, examTypes, academicYear]);

  if (!isOpen) return null;

  const handleClassToggle = (className) => {
    setFormData((prev) => {
      const exists = prev.selectedClasses.includes(className);
      const updated = exists
        ? prev.selectedClasses.filter((c) => c !== className)
        : [...prev.selectedClasses, className];
      return { ...prev, selectedClasses: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Exam Name is required';
    if (!formData.type) errs.type = 'Exam Type is required';
    if (!formData.startDate) errs.startDate = 'Start Date is required';
    if (!formData.endDate) errs.endDate = 'End Date is required';
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errs.endDate = 'End Date cannot be before Start Date';
    }
    if (formData.selectedClasses.length === 0) errs.classes = 'Select at least one class';

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const body = {
      name: formData.name.trim(),
      type: formData.type,
      academicYear: formData.academicYear || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      classes: formData.selectedClasses,
      description: formData.description.trim(),
    };

    setSaving(true);
    setServerError('');
    try {
      const saved = isEditing
        ? await http.put(`/exams/${examToEdit.id}`, body)
        : await http.post('/exams', body);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                {isEditing ? 'Edit Examination' : 'Create New Examination'}
              </h3>
              <p className="text-xs text-slate-400">Configure exam parameters and target classes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Exam Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Exam Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mid-Term Examination 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C]"
            />
            {errors.name && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Exam Type & Academic Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Exam Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
              >
                {examTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.type && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.type}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500"
              />
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
              />
              {errors.startDate && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
              />
              {errors.endDate && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Target Classes (Multi-select pill badges) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Classes *</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
              {classes.length === 0 && <span className="text-xs text-slate-400">No classes found.</span>}
              {classes.map((cls) => {
                const isSelected = formData.selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassToggle(cls)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF6B2C] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Class {cls}
                  </button>
                );
              })}
            </div>
            {errors.classes && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.classes}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Instructions or guidelines for teachers and students..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800"
            />
          </div>

          {serverError && <p className="text-xs font-semibold text-rose-600">{serverError}</p>}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              {tx('Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer disabled:opacity-60"
            >
              {saving ? tx('Saving…') : tx(isEditing ? 'Save Changes' : 'Create Exam')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
