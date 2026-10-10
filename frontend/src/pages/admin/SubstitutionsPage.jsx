import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Repeat, Trash2 } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http, withQuery } from '@/api/http';
import { addDays, formatDate, todayIso, weekdayName } from '@/utils';

const teacherHint = (t) => {
  const tags = [];
  if (t.teachesSubject) tags.push('teaches subject');
  if (t.teachesClass) tags.push('teaches class');
  tags.push(`${t.periodsToday} ${t.periodsToday === 1 ? 'period' : 'periods'} today`);
  return tags.join(', ');
};

/** /admin/substitutions — periods of absent teachers that day, and who covers them. */
export const SubstitutionsPage = () => {
  const today = todayIso();
  const [date, setDate] = useState(today);
  const needs = useApi(withQuery('/substitutions/needs', { date }));
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const run = async (key, action, success) => {
    setBusyKey(key);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
      needs.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  };

  const assign = (need, substituteTeacherId) => {
    if (!substituteTeacherId) return;
    const sub = need.freeTeachers.find((t) => t.teacherId === substituteTeacherId);
    run(
      `${need.className}-${need.periodId}`,
      () => http.put('/substitutions', { date, className: need.className, periodId: need.periodId, substituteTeacherId }),
      `${sub?.name ?? 'The teacher'} will cover ${need.subject} in ${need.className} (${need.periodLabel}).`,
    );
  };

  const remove = (need) =>
    run(
      `${need.className}-${need.periodId}`,
      () => http.delete(`/substitutions/${need.substitution.id}`),
      'Substitute removed.',
    );

  return (
    <AdminPageShell
      activeItemId="substitutions"
      title="Substitutions"
      description="Periods whose teacher is absent or on leave, and the free teachers who can cover them."
    >
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {weekdayName(date)}, {formatDate(date)}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Teachers count as away when marked absent / on leave in Staff Attendance, or when their leave is approved.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setDate(today)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-[#FF6B2C] cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDate(addDays(today, 1))}
            className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-[#FF6B2C] cursor-pointer"
          >
            Tomorrow
          </button>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-500">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
        </p>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AsyncState state={needs} loadingText="Finding periods to cover…">
          {(list) => {
            if (!list || list.length === 0) {
              return <EmptyMessage text="No teacher is away on this day — nothing to cover." />;
            }
            const covered = list.filter((n) => n.substitution).length;
            return (
              <>
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 text-xs font-bold text-slate-600">
                  {covered} of {list.length} periods covered
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 sm:px-6">Period</th>
                        <th className="py-3 px-4">Class / subject</th>
                        <th className="py-3 px-4">Absent teacher</th>
                        <th className="py-3 px-4">Substitute</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {list.map((need) => {
                        const key = `${need.className}-${need.periodId}`;
                        const busy = busyKey === key;
                        const best = need.freeTeachers?.[0];
                        return (
                          <tr key={key} className={need.substitution ? 'bg-emerald-50/30' : 'hover:bg-slate-50/60'}>
                            <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                              <div className="font-bold text-slate-900">{need.periodLabel}</div>
                              <div className="text-[11px] text-slate-400">
                                {need.startTime} – {need.endTime}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">Class {need.className}</div>
                              <div className="text-[11px] text-slate-500">
                                {need.subject}
                                {need.room ? ` · ${need.room}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{need.teacherName}</td>
                            <td className="py-3 px-4">
                              {need.substitution && (
                                <div className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                  <Repeat className="w-3 h-3" /> {need.substitution.substituteTeacherName}
                                </div>
                              )}
                              {need.freeTeachers?.length ? (
                                <select
                                  value=""
                                  disabled={busy}
                                  onChange={(e) => assign(need, e.target.value)}
                                  className="block h-9 w-full max-w-[320px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none cursor-pointer"
                                >
                                  <option value="">{need.substitution ? 'Change substitute…' : 'Choose a free teacher…'}</option>
                                  {need.freeTeachers.map((t, i) => (
                                    <option key={t.teacherId} value={t.teacherId}>
                                      {i < 3 && (t.teachesSubject || t.teachesClass) ? '★ ' : ''}
                                      {t.name} ({teacherHint(t)})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[11px] font-semibold text-rose-600">No teacher is free in this period.</span>
                              )}
                              {!need.substitution && best && (
                                <div className="mt-1 text-[10px] text-slate-400">Best match: {best.name}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 sm:px-6">
                              <div className="flex justify-end gap-2">
                                {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                                {!need.substitution && best && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => assign(need, best.teacherId)}
                                    className="rounded-lg border border-[#FF6B2C] bg-[#FF6B2C] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#F25A1B] disabled:opacity-50 cursor-pointer"
                                  >
                                    Assign best
                                  </button>
                                )}
                                {need.substitution && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => remove(need)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          }}
        </AsyncState>
      </div>
    </AdminPageShell>
  );
};

export default SubstitutionsPage;
