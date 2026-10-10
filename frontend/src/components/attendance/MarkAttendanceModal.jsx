import React, { useMemo, useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http, withQuery } from '@/api/http';
import { formatDate, todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';

const STATUSES = ['present', 'absent', 'late', 'leave'];
const ACTIVE_STYLES = {
  present: 'bg-emerald-500 text-white shadow-xs',
  absent: 'bg-rose-500 text-white shadow-xs',
  late: 'bg-amber-500 text-white shadow-xs',
  leave: 'bg-sky-500 text-white shadow-xs',
  holiday: 'bg-slate-500 text-white shadow-xs',
};

/**
 * Marks one class for one day: loads the roster (GET /classes/{id}/students) and anything already marked
 * (GET /attendance?className=&date=), then saves with PUT /attendance (re-marking a day overwrites it).
 * Mounted only while open.
 */
export const MarkAttendanceModal = ({ classOptions = [], initialClass = '', initialDate, onClose, onSaved }) => {
  const { tx } = useI18n();
  const today = todayIso();
  const [selectedClass, setSelectedClass] = useState(initialClass || classOptions[0] || '');
  const [selectedDate, setSelectedDate] = useState(initialDate || today);
  // Changes made in this dialog, keyed by "class|date" so switching class/date starts fresh.
  const [edits, setEdits] = useState({ key: '', statuses: {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const key = `${selectedClass}|${selectedDate}`;
  const roster = useApi(selectedClass ? `/classes/${encodeURIComponent(selectedClass)}/students` : null);
  const existing = useApi(selectedClass ? withQuery('/attendance', { className: selectedClass, date: selectedDate }) : null);

  const existingByStudent = useMemo(
    () => new Map((existing.data || []).map((r) => [r.studentId, r.status])),
    [existing.data],
  );
  const changes = edits.key === key ? edits.statuses : {};
  const statusOf = (studentId) => changes[studentId] || existingByStudent.get(studentId) || 'present';
  const alreadyMarked = (existing.data || []).length > 0;

  const setStatus = (studentId, status) =>
    setEdits((prev) => ({ key, statuses: { ...(prev.key === key ? prev.statuses : {}), [studentId]: status } }));

  const setAll = (status) =>
    setEdits({ key, statuses: Object.fromEntries((roster.data || []).map((s) => [s.id, status])) });

  const handleSave = async () => {
    if (!selectedClass || !roster.data?.length) return;
    if (selectedDate > today) {
      setError('Attendance cannot be marked for a future date.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await http.put('/attendance', {
        className: selectedClass,
        date: selectedDate,
        entries: roster.data.map((s) => ({ studentId: s.id, status: statusOf(s.id) })),
      });
      onSaved(`Attendance saved for Class ${selectedClass} on ${formatDate(selectedDate)}.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">{tx('Mark Class Attendance')}</h3>
              <p className="text-xs text-slate-400">Select class and date, then mark each student</p>
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

        {/* Filters Top Row */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
            >
              {classOptions.length === 0 && <option value="">No classes</option>}
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Date *</label>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-[11px] font-semibold text-slate-500">
            {existing.data ? (alreadyMarked ? 'Already marked — saving will overwrite this day.' : 'Not marked yet.') : ''}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="text-slate-400">Set all:</span>
            {['present', 'holiday'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setAll(st)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 capitalize cursor-pointer"
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Student Rows List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar my-2">
          <AsyncState state={[roster, existing]} loadingText="Loading students…">
            {([students]) =>
              students.length === 0 ? (
                <EmptyMessage text={`No students found in Class ${selectedClass}.`} />
              ) : (
                students.map((s) => {
                  const currentStatus = statusOf(s.id);
                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{s.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          Roll No. {s.rollNumber} • {s.id}
                        </p>
                      </div>

                      <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 self-start sm:self-auto">
                        {(currentStatus === 'holiday' ? [...STATUSES, 'holiday'] : STATUSES).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatus(s.id, st)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                              currentStatus === st ? ACTIVE_STYLES[st] : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )
            }
          </AsyncState>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs font-medium text-rose-700">{error}</div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            {tx('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !roster.data?.length}
            className="px-5 py-2.5 rounded-2xl bg-[#FF6B2C] hover:bg-[#e85a1c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer"
          >
            {saving ? tx('Saving…') : tx('Save Attendance')}
          </button>
        </div>
      </div>
    </div>
  );
};
