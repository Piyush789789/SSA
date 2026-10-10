import React, { useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { http } from '@/api/http';

const NONE = [];

/** "09:00 AM" -> "09:00" (for <input type="time">). Already 24h values pass through. */
const to24h = (value) => {
  if (!value) return '';
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '';
  let hour = Number(match[1]);
  const suffix = match[3]?.toUpperCase();
  if (suffix === 'PM' && hour < 12) hour += 12;
  if (suffix === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
};

/** "13:30" -> "01:30 PM" (the format papers are stored in). */
const to12h = (value) => {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

/**
 * Add a paper to an exam (POST /exams/{id}/schedules) or edit one (PUT /exam-schedules/{id}).
 * `exam` gives the id and the classes the paper may be for; `subjects` come from GET /meta.
 */
export const AddExamScheduleModal = ({ isOpen, onClose, onSaved, exam, subjects = NONE, scheduleToEdit = null }) => {
  const isEditing = Boolean(scheduleToEdit);
  const examClasses = exam?.classes || NONE;

  const [formData, setFormData] = useState({
    className: '',
    subject: '',
    date: '',
    startTime: '09:00',
    endTime: '12:00',
    maxMarks: 100,
    passingMarks: 33,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (scheduleToEdit) {
      setFormData({
        className: scheduleToEdit.className,
        subject: scheduleToEdit.subject,
        date: scheduleToEdit.date || '',
        startTime: to24h(scheduleToEdit.startTime),
        endTime: to24h(scheduleToEdit.endTime),
        maxMarks: scheduleToEdit.maxMarks,
        passingMarks: scheduleToEdit.passingMarks,
      });
    } else {
      setFormData({
        className: examClasses[0] || '',
        subject: subjects[0] || '',
        date: exam?.startDate || '',
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 33,
      });
    }
    setSaving(false);
    setError('');
  }, [isOpen, scheduleToEdit, examClasses, subjects, exam?.startDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.className || !formData.subject || !formData.date) {
      setError('Class, subject and date are required.');
      return;
    }
    if (Number(formData.maxMarks) <= 0) {
      setError('Maximum marks must be greater than 0.');
      return;
    }
    if (Number(formData.passingMarks) < 0 || Number(formData.passingMarks) > Number(formData.maxMarks)) {
      setError('Passing marks must be between 0 and the maximum marks.');
      return;
    }

    const body = {
      className: formData.className,
      subject: formData.subject,
      date: formData.date,
      startTime: to12h(formData.startTime),
      endTime: to12h(formData.endTime),
      maxMarks: Number(formData.maxMarks),
      passingMarks: Number(formData.passingMarks),
    };

    setSaving(true);
    setError('');
    try {
      const saved = isEditing
        ? await http.put(`/exam-schedules/${scheduleToEdit.id}`, { ...body, examId: scheduleToEdit.examId })
        : await http.post(`/exams/${exam.id}/schedules`, body);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              {isEditing ? 'Edit Exam Paper' : 'Add Exam Subject Schedule'}
            </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Class *</label>
              <select
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
              >
                {examClasses.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Exam Date *</label>
            <input
              type="date"
              value={formData.date}
              min={exam?.startDate}
              max={exam?.endDate}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Marks *</label>
              <input
                type="number"
                min="1"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Passing Marks *</label>
              <input
                type="number"
                min="0"
                value={formData.passingMarks}
                onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
                required
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

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
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
