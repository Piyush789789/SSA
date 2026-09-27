import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const FeeHeadModal = ({ isOpen, feeHeadToEdit, onClose, onSave }) => {
  const isEditing = Boolean(feeHeadToEdit);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    frequency: 'One-Time',
    dueDate: '',
    academicYear: '2026-27',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (feeHeadToEdit) {
        setFormData({
          title: feeHeadToEdit.title || '',
          amount: feeHeadToEdit.amount || '',
          frequency: feeHeadToEdit.frequency || 'One-Time',
          dueDate: feeHeadToEdit.dueDate || '',
          academicYear: feeHeadToEdit.academicYear || '2026-27',
        });
      } else {
        setFormData({
          title: '',
          amount: '',
          frequency: 'One-Time',
          dueDate: new Date().toISOString().split('T')[0],
          academicYear: '2026-27',
        });
      }
      setErrors({});
    }
  }, [isOpen, feeHeadToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Fee Head Title is required.';
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than ₹0.';
    }
    if (!formData.frequency) newErrors.frequency = 'Frequency is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...(feeHeadToEdit || {}),
      title: formData.title.trim(),
      amount: Number(formData.amount),
      frequency: formData.frequency,
      dueDate: formData.dueDate,
      academicYear: formData.academicYear,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-extrabold text-slate-900">
            {isEditing ? 'Edit Fee Head' : 'Add Fee Head'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Fee Head Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Tuition Fee — Quarter 1 (2026-27)"
              className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-500 font-medium">{errors.title}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 4500"
              className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                errors.amount
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
              }`}
            />
            {errors.amount && <p className="text-xs text-rose-500 font-medium">{errors.amount}</p>}
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Frequency <span className="text-rose-500">*</span>
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
            >
              <option value="One-Time">One-Time</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {/* Due Date & Academic Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Academic Year
              </label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
              >
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
                <option value="2027-28">2027-28</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Add Fee Head'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
