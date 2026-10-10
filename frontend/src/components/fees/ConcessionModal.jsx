import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/utils';
import { useI18n } from '@/i18n/translate';

const NONE = [];

/**
 * Grants a concession on one of a student's unpaid dues (POST /fees/concessions). The admin picks class →
 * student → due; the concession lowers what is owed on that due. `concessionTypes` come from GET /meta.
 */
export const ConcessionModal = ({ isOpen, classes = NONE, concessionTypes = NONE, onClose, onSaved }) => {
  const { tx } = useI18n();
  const [className, setClassName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [feeDueId, setFeeDueId] = useState('');
  const [type, setType] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setClassName(classes[0] || '');
    setStudentId('');
    setFeeDueId('');
    setType(concessionTypes[0] || '');
    setDiscountType('PERCENTAGE');
    setDiscountValue('10');
    setDescription('');
    setError('');
    setSaving(false);
  }, [isOpen, classes, concessionTypes]);

  const studentsApi = useApi(isOpen && className ? withQuery('/students', { className }) : null);
  const students = studentsApi.data || NONE;
  const effectiveStudentId = students.some((s) => s.id === studentId) ? studentId : students[0]?.id || '';

  const duesApi = useApi(isOpen && effectiveStudentId ? withQuery('/fees/dues', { studentId: effectiveStudentId }) : null);
  const openDues = (duesApi.data || NONE).filter((d) => d.pending > 0);
  const selectedDue = openDues.find((d) => d.id === feeDueId) || openDues[0] || null;

  if (!isOpen) return null;

  const value = Number(discountValue);
  const discount = selectedDue
    ? discountType === 'PERCENTAGE'
      ? Math.round((selectedDue.amount * (Number.isNaN(value) ? 0 : value)) / 100)
      : Math.round(Number.isNaN(value) ? 0 : value)
    : 0;
  const pendingAfter = selectedDue ? selectedDue.pending - discount : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDue) {
      setError('Pick a student with an unpaid fee.');
      return;
    }
    if (!type) {
      setError('Concession type is required.');
      return;
    }
    if (!(value > 0)) {
      setError('Discount value must be greater than 0.');
      return;
    }
    if (discountType === 'PERCENTAGE' && value > 100) {
      setError('A percentage concession cannot exceed 100.');
      return;
    }
    if (discount > selectedDue.pending) {
      setError(`The concession (${formatCurrency(discount)}) exceeds the pending balance of ${formatCurrency(selectedDue.pending)}.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = await http.post('/fees/concessions', {
        feeDueId: selectedDue.id,
        type,
        discountType,
        discountValue: value,
        description: description.trim() || `${type} concession`,
      });
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const selectClass =
    'w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-extrabold text-slate-900">{tx('Add Concession')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Class</label>
              <select
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setStudentId('');
                  setFeeDueId('');
                }}
                className={selectClass}
              >
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Student <span className="text-rose-500">*</span>
              </label>
              <select
                value={effectiveStudentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setFeeDueId('');
                }}
                disabled={students.length === 0}
                className={selectClass}
              >
                {studentsApi.loading && <option value="">Loading…</option>}
                {!studentsApi.loading && students.length === 0 && <option value="">No students</option>}
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} (Roll {st.rollNumber} • {st.id})
                  </option>
                ))}
              </select>
              {studentsApi.error && <p className="text-xs text-rose-500">{studentsApi.error.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Unpaid Fee <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDue?.id || ''}
              onChange={(e) => setFeeDueId(e.target.value)}
              disabled={openDues.length === 0}
              className={selectClass}
            >
              {duesApi.loading && <option value="">Loading…</option>}
              {!duesApi.loading && openDues.length === 0 && <option value="">No unpaid fees for this student</option>}
              {openDues.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} (pending {formatCurrency(d.pending)})
                </option>
              ))}
            </select>
            {duesApi.error && <p className="text-xs text-rose-500">{duesApi.error.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Concession Type <span className="text-rose-500">*</span>
            </label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
              {concessionTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Discount Type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={selectClass}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Discount Value <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="e.g. 10 or 500"
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          {selectedDue && (
            <div className="bg-[#FFF5F0] border border-[#FF6B2C]/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500">Fee:</span>{' '}
                <strong className="text-slate-800">{formatCurrency(selectedDue.amount)}</strong>
              </div>
              <div>
                <span className="text-slate-500">Discount:</span>{' '}
                <strong className="text-emerald-600">{formatCurrency(discount)}</strong>
              </div>
              <div>
                <span className="text-slate-500">Pending after:</span>{' '}
                <strong className="text-[#FF6B2C] text-sm font-extrabold">{formatCurrency(Math.max(0, pendingAfter))}</strong>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description / Reason</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sibling discount approved"
              className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

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
              disabled={saving || !selectedDue}
              className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? tx('Saving…') : tx('Add Concession')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
