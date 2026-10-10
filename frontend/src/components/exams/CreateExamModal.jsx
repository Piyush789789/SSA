import React, { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';
import { EXAM_TYPES } from '@/data/examsData';
import { CLASSES_LIST } from '@/data/attendanceData';

export const CreateExamModal = ({ isOpen, onClose, onCreateExam }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Mid-Term',
    academicYear: '2026-27',
    startDate: '',
    endDate: '',
    selectedClasses: ['10-A'],
    description: '',
  });

  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Exam Name is required';
    if (!formData.startDate) errs.startDate = 'Start Date is required';
    if (!formData.endDate) errs.endDate = 'End Date is required';
    if (formData.selectedClasses.length === 0) errs.classes = 'Select at least one class';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onCreateExam(formData);
    onClose();
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
              <h3 className="font-extrabold text-slate-900 text-lg">Create New Examination</h3>
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
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year *</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
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
              {CLASSES_LIST.map((c) => {
                const isSelected = formData.selectedClasses.includes(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleClassToggle(c.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF6B2C] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Class {c.name}
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

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer"
            >
              Create Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
