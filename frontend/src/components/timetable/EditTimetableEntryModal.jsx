import React, { useState } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/translate';

/**
 * Edit one timetable cell. Saves with PUT /timetable/entries and clears with DELETE /timetable/entries/{id}
 * through `onSave` / `onClear`, which return promises; their error messages (e.g. teacher busy) are shown here.
 * Only teachers assigned to the class who teach the chosen subject are offered (the server requires it).
 */
export const EditTimetableEntryModal = ({ isOpen, cellData, ...props }) => {
  if (!isOpen || !cellData) return null;
  return <EntryForm key={`${cellData.day}-${cellData.period.id}`} cellData={cellData} {...props} />;
};

const EntryForm = ({ cellData, subjects = [], teachers = [], optionsError, onClose, onSave, onClear }) => {
  const { tx } = useI18n();
  const { classId, day, period, entry } = cellData;
  const [subject, setSubject] = useState(entry?.subject || '');
  const [teacherId, setTeacherId] = useState(entry?.teacherId || '');
  const [room, setRoom] = useState(entry?.room || '');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const qualified = teachers.filter(
    (t) => (t.assignedClasses || []).includes(classId) && (!subject || (t.subjects || []).includes(subject)),
  );
  const subjectOptions = [...new Set([...subjects, ...(entry?.subject ? [entry.subject] : [])])];

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!subject) return setError('Please choose a subject.');
    if (!teacherId) return setError('Please choose a teacher.');
    return run(() =>
      onSave({ className: classId, day, periodId: period.id, subject, teacherId, room: room.trim() || null }),
    );
  };

  const dayLabel = day.charAt(0) + day.slice(1).toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {entry ? 'Edit' : 'Add'} Entry — Class {classId} · {dayLabel} · {period.label}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Time: {period.startTime} – {period.endTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {optionsError && (
          <div className="bg-amber-50 text-amber-800 text-xs font-medium p-3 rounded-xl border border-amber-200">
            Could not load teachers/subjects: {optionsError.message}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 text-rose-700 text-xs font-medium p-3 rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {showClearConfirm ? (
          <div className="space-y-4 bg-rose-50/60 border border-rose-100 p-5 rounded-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-rose-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Clear this timetable entry?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove {entry.subject} ({entry.teacherName}) from {dayLabel}, {period.label}.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-white text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 cursor-pointer"
              >
                {tx('Cancel')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => onClear(entry))}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {busy ? 'Clearing…' : 'Clear Entry'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setTeacherId('');
                }}
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 font-medium focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">Select subject...</option>
                {subjectOptions.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Teacher <span className="text-rose-500">*</span>
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                disabled={!subject}
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 font-medium focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">{subject ? 'Select teacher...' : 'Choose a subject first'}</option>
                {qualified.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({(t.subjects || []).join(', ')})
                  </option>
                ))}
              </select>
              {subject && qualified.length === 0 && (
                <p className="text-[11px] text-amber-600">
                  No teacher assigned to Class {classId} teaches {subject}. Assign one on the Teachers page first.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Room (optional)</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. 204, Lab 1"
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {entry ? (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  {tx('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer"
                >
                  {busy ? tx('Saving…') : tx('Save')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
