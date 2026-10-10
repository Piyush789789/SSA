import React, { useState } from 'react';
import { AlertCircle, CalendarPlus, CheckCircle2, Loader2, Send, Trash2, XCircle } from 'lucide-react';
import { http } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { EmptyMessage } from '@/components/common/AsyncState';
import { addDays, formatDate, formatDateTime, parseIsoDate, todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';

const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};
const STATUS_LABELS = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' };

export const LeaveStatusChip = ({ status }) => {
  const { tx } = useI18n();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${
        STATUS_STYLES[status] ?? 'bg-slate-50 text-slate-500 border-slate-200'
      }`}
    >
      {tx(STATUS_LABELS[status] ?? status)}
    </span>
  );
};

/** Calendar days in an inclusive range. */
const dayCount = (from, to) => Math.round((parseIsoDate(to) - parseIsoDate(from)) / 86_400_000) + 1;

const rangeLabel = (leave) =>
  leave.fromDate === leave.toDate
    ? formatDate(leave.fromDate)
    : `${formatDate(leave.fromDate)} – ${formatDate(leave.toDate)} (${dayCount(leave.fromDate, leave.toDate)} days)`;

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none';

/**
 * "Apply for leave" form. Students apply for themselves, parents pass `studentId` (the selected child),
 * teachers apply for their own staff leave. At most 60 days, and no more than 30 days back.
 */
export const LeaveApplyForm = ({ studentId, forName, onApplied }) => {
  const today = todayIso();
  const { tx } = useI18n();
  const [values, setValues] = useState({ fromDate: today, toDate: today, reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const set = (key) => (e) => {
    setDone('');
    setValues((v) => {
      const next = { ...v, [key]: e.target.value };
      if (key === 'fromDate' && next.toDate < next.fromDate) next.toDate = next.fromDate;
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (values.toDate < values.fromDate) {
      setError('The end date is before the start date.');
      return;
    }
    if (dayCount(values.fromDate, values.toDate) > 60) {
      setError('One application can cover at most 60 days.');
      return;
    }
    setSaving(true);
    setError('');
    setDone('');
    try {
      await http.post('/leaves', { studentId: studentId || undefined, ...values, reason: values.reason.trim() });
      setValues({ fromDate: today, toDate: today, reason: '' });
      setDone('Leave application sent.');
      onApplied?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-[#FF6B2C]" /> {tx('Apply for leave')}
        </h2>
        {forName && <p className="text-xs text-slate-500 mt-0.5">For {forName}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">{tx('From')}</span>
          <input type="date" required min={addDays(today, -30)} value={values.fromDate} onChange={set('fromDate')} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">{tx('To')}</span>
          <input type="date" required min={values.fromDate} value={values.toDate} onChange={set('toDate')} className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-slate-700">{tx('Reason')}</span>
        <textarea
          required
          rows={3}
          maxLength={1000}
          value={values.reason}
          onChange={set('reason')}
          placeholder="e.g. Fever, family function…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
        />
      </label>
      <p className="text-[11px] text-slate-400">Up to 60 days per application, starting no more than 30 days ago.</p>
      {error && (
        <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {done && (
        <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {done}
        </p>
      )}
      <button
        type="submit"
        disabled={saving || !values.reason.trim()}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B2C] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60 cursor-pointer"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {saving ? tx('Sending…') : tx('Apply')}
      </button>
    </form>
  );
};

/**
 * List of leave applications. The applicant can withdraw a pending one; with `canDecide(leave)` a reviewer gets
 * Approve / Reject with an optional note. `showPerson` adds who the leave is for.
 */
export const LeaveList = ({ leaves, onChanged, canDecide, showPerson = false, emptyText = 'No leave applications yet.' }) => {
  const { currentUser } = useAuth();
  const { tx } = useI18n();
  const myIds = [currentUser?.userId, currentUser?.id].filter(Boolean);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');

  const run = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      await action();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const withdraw = (leave) => {
    if (!window.confirm('Withdraw this leave application?')) return;
    run(leave.id, () => http.delete(`/leaves/${leave.id}`));
  };

  const decide = (leave, approve) =>
    run(leave.id, () => http.post(`/leaves/${leave.id}/decision`, { approve, note: notes[leave.id]?.trim() || undefined }));

  if (!leaves || leaves.length === 0) return <EmptyMessage text={emptyText} />;

  return (
    <div>
      {error && (
        <p className="m-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      <ul className="divide-y divide-slate-100">
        {leaves.map((leave) => {
          const busy = busyId === leave.id;
          const mine = myIds.includes(leave.appliedById);
          const decidable = leave.status === 'PENDING' && canDecide?.(leave);
          return (
            <li key={leave.id} className="p-4 sm:p-5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="min-w-0">
                  {showPerson && (
                    <p className="text-sm font-extrabold text-slate-900">
                      {leave.personName}
                      <span className="ml-2 text-[11px] font-semibold text-slate-400">
                        {leave.applicantType === 'STAFF' ? 'Staff' : `Class ${leave.className ?? '—'}`}
                      </span>
                    </p>
                  )}
                  <p className="text-sm font-bold text-slate-800">{rangeLabel(leave)}</p>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{leave.reason}</p>
                </div>
                <LeaveStatusChip status={leave.status} />
              </div>
              <p className="text-[11px] text-slate-400">
                Applied {formatDateTime(leave.appliedAt)}
                {leave.appliedByName ? ` by ${leave.appliedByName}` : ''}
                {leave.reviewedByName && leave.status !== 'PENDING'
                  ? ` · ${STATUS_LABELS[leave.status]} by ${leave.reviewedByName}${leave.reviewedAt ? ` on ${formatDateTime(leave.reviewedAt)}` : ''}`
                  : ''}
              </p>
              {leave.reviewNote && (
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/70 rounded-xl p-2.5">
                  <strong>Note:</strong> {leave.reviewNote}
                </p>
              )}

              {decidable && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    value={notes[leave.id] ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [leave.id]: e.target.value }))}
                    placeholder="Note (optional)"
                    maxLength={1000}
                    className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => decide(leave, true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {tx('Approve')}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => decide(leave, false)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> {tx('Reject')}
                    </button>
                  </div>
                </div>
              )}

              {mine && leave.status === 'PENDING' && !decidable && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => withdraw(leave)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} {tx('Withdraw')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
