import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { calculateEffectiveAmount, formatCurrency } from '@/data/feeData';

export const ConcessionModal = ({
  isOpen,
  students,
  feeHeads,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    studentId: '',
    feeHeadId: '',
    type: 'Sibling',
    discountType: 'Percentage',
    discountValue: '10',
    description: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        studentId: students[0]?.id || '',
        feeHeadId: feeHeads[0]?.id || '',
        type: 'Sibling',
        discountType: 'Percentage',
        discountValue: '10',
        description: '',
      });
      setErrors({});
    }
  }, [isOpen, students, feeHeads]);

  if (!isOpen) return null;

  const selectedFeeHead = feeHeads.find((f) => String(f.id) === String(formData.feeHeadId)) || feeHeads[0];
  const grossAmount = selectedFeeHead ? selectedFeeHead.amount : 0;
  const effectiveAmount = calculateEffectiveAmount(
    grossAmount,
    formData.discountType,
    formData.discountValue
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.studentId) newErrors.studentId = 'Student is required.';
    if (!formData.feeHeadId) newErrors.feeHeadId = 'Fee Structure is required.';
    if (!formData.discountValue || Number(formData.discountValue) < 0) {
      newErrors.discountValue = 'Please enter a valid discount value.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const studentObj = students.find((s) => String(s.id) === String(formData.studentId));

    onSave({
      id: Date.now(),
      studentId: Number(formData.studentId),
      studentName: studentObj ? studentObj.name : 'Student',
      className: studentObj ? studentObj.className : '1-A',
      feeStructure: selectedFeeHead ? selectedFeeHead.title : 'Tuition Fee',
      type: formData.type,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      grossAmount,
      effectiveAmount,
      description: formData.description.trim() || `${formData.type} concession approved.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-extrabold text-slate-900">Add Concession</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Student */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Student <span className="text-rose-500">*</span>
            </label>
            <select
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.className} • {st.studentId})
                </option>
              ))}
            </select>
          </div>

          {/* Select Fee Structure */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Fee Structure <span className="text-rose-500">*</span>
            </label>
            <select
              name="feeHeadId"
              value={formData.feeHeadId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
            >
              {feeHeads.map((fh) => (
                <option key={fh.id} value={fh.id}>
                  {fh.title} ({formatCurrency(fh.amount)})
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Concession Type <span className="text-rose-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
            >
              <option value="Sibling">Sibling</option>
              <option value="Merit">Merit</option>
              <option value="SC/ST">SC/ST</option>
              <option value="Staff Ward">Staff Ward</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Discount Type
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Flat Amount">Flat Amount (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Discount Value <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                placeholder="e.g. 10 or 500"
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Effective Amount Display Banner */}
          <div className="bg-[#FFF5F0] border border-[#FF6B2C]/20 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Gross Fee:</span>{' '}
              <strong className="text-slate-800">{formatCurrency(grossAmount)}</strong>
            </div>
            <div>
              <span className="text-slate-500">Effective Amount:</span>{' '}
              <strong className="text-[#FF6B2C] text-sm font-extrabold">
                {formatCurrency(effectiveAmount)}
              </strong>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description / Reason
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Sibling discount approved for 2026-27"
              className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
            />
          </div>

          {/* Buttons */}
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
              Add Concession
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
