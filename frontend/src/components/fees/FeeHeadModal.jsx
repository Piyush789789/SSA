import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { http } from '@/api/http';
import { todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';

const NONE = [];

/**
 * Add (POST /fees/heads) or edit (PUT /fees/heads/{id}) a fee head. The admin picks the classes it applies to;
 * creating one bills every student of those classes. `frequencies` / `academicYear` come from GET /meta.
 */
export const FeeHeadModal = ({
  isOpen,
  feeHeadToEdit,
  classes = NONE,
  frequencies = NONE,
  academicYear = '',
  onClose,
  onSaved,
}) => {
  const { tx } = useI18n();
  const isEditing = Boolean(feeHeadToEdit);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    frequency: '',
    dueDate: '',
    classNames: [],
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (feeHeadToEdit) {
      setFormData({
        title: feeHeadToEdit.title || '',
        amount: feeHeadToEdit.amount ?? '',
        frequency: feeHeadToEdit.frequency || frequencies[0] || '',
        dueDate: feeHeadToEdit.dueDate || '',
        classNames: feeHeadToEdit.classNames || [],
      });
    } else {
      setFormData({ title: '', amount: '', frequency: frequencies[0] || '', dueDate: todayIso(), classNames: [] });
    }
    setErrors({});
    setServerError('');
    setSaving(false);
  }, [isOpen, feeHeadToEdit, frequencies]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const toggleClass = (cls) =>
    setFormData((prev) => ({
      ...prev,
      classNames: prev.classNames.includes(cls) ? prev.classNames.filter((c) => c !== cls) : [...prev.classNames, cls],
    }));

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Fee Head Title is required.';
    if (!formData.amount || Number(formData.amount) <= 0 || !Number.isInteger(Number(formData.amount))) {
      newErrors.amount = 'Amount must be a whole number greater than ₹0.';
    }
    if (!formData.frequency) newErrors.frequency = 'Frequency is required.';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required.';
    if (formData.classNames.length === 0) newErrors.classNames = 'Select at least one class.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      title: formData.title.trim(),
      amount: Number(formData.amount),
      frequency: formData.frequency,
      dueDate: formData.dueDate,
      academicYear: feeHeadToEdit?.academicYear || academicYear || undefined,
      classNames: formData.classNames,
    };

    setSaving(true);
    setServerError('');
    try {
      const saved = isEditing
        ? await http.put(`/fees/heads/${feeHeadToEdit.id}`, body)
        : await http.post('/fees/heads', body);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
      hasError ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-extrabold text-slate-900">{tx(isEditing ? 'Edit Fee Head' : 'Add Fee Head')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Fee Head Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Tuition Fee — Quarter 1"
              className={inputClass(errors.title)}
            />
            {errors.title && <p className="text-xs text-rose-500 font-medium">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 4500"
              className={inputClass(errors.amount)}
            />
            {errors.amount && <p className="text-xs text-rose-500 font-medium">{errors.amount}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Frequency <span className="text-rose-500">*</span>
              </label>
              <select name="frequency" value={formData.frequency} onChange={handleChange} className={inputClass(errors.frequency)}>
                {frequencies.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className={inputClass(errors.dueDate)} />
              {errors.dueDate && <p className="text-xs text-rose-500 font-medium">{errors.dueDate}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Applies to Classes <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
              {classes.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      classNames: prev.classNames.length === classes.length ? [] : [...classes],
                    }))
                  }
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-white text-[#FF6B2C] border border-orange-200 hover:bg-orange-50 cursor-pointer"
                >
                  {formData.classNames.length === classes.length ? 'Clear all' : 'Select all'}
                </button>
              )}
              {classes.map((cls) => {
                const isSelected = formData.classNames.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => toggleClass(cls)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
            {errors.classNames && <p className="text-xs text-rose-500 font-medium">{errors.classNames}</p>}
            {!isEditing && (
              <p className="text-[11px] text-slate-400">Every student of the selected classes will be billed this fee.</p>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Academic Year: <strong className="text-slate-700">{feeHeadToEdit?.academicYear || academicYear || '—'}</strong>
          </div>

          {serverError && <p className="text-xs font-semibold text-rose-600">{serverError}</p>}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? tx('Saving…') : tx(isEditing ? 'Save Changes' : 'Add Fee Head')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
