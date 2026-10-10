import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save, UserCheck } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { STAFF_STATUSES, STAFF_STATUS_LABELS, STAFF_STATUS_STYLES } from '@/components/staff/staffStatus';
import { useApi } from '@/hooks/useApi';
import { http, withQuery } from '@/api/http';
import { formatDate, toIsoDate, todayIso, weekdayName } from '@/utils';
import { useI18n } from '@/i18n/translate';

const TABS = [
  { id: 'sheet', label: 'Daily sheet' },
  { id: 'report', label: 'Monthly report' },
];

/** /admin/staff-attendance — mark teachers' attendance for a day and see the monthly report. */
export const StaffAttendancePage = () => {
  const [tab, setTab] = useState('sheet');
  const { tx } = useI18n();

  return (
    <AdminPageShell
      activeItemId="staff-attendance"
      title="Staff Attendance"
      description="Teachers' daily attendance. Teachers can also check in and out themselves from their portal."
    >
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold border cursor-pointer ${
              tab === t.id ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {tx(t.label)}
          </button>
        ))}
      </div>
      {tab === 'sheet' ? <DailySheet /> : <MonthlyReport />}
    </AdminPageShell>
  );
};

const DailySheet = () => {
  const today = todayIso();
  const [date, setDate] = useState(today);
  const sheet = useApi(withQuery('/staff-attendance', { date }));
  const holiday = useApi(withQuery('/calendar/check', { date }));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {weekdayName(date)}, {formatDate(date)}
          </h2>
          {holiday.data?.holiday && (
            <p className="text-xs font-semibold text-rose-600 mt-1">
              Holiday{holiday.data.title ? ` — ${holiday.data.title}` : ''}. Attendance is not needed today.
            </p>
          )}
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-slate-500">Date</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
          />
        </label>
      </div>
      <AsyncState state={sheet} loadingText="Loading staff…">
        {(rows) =>
          rows.length === 0 ? (
            <EmptyMessage text="No teachers yet." />
          ) : (
            <SheetEditor key={date} date={date} rows={rows} onSaved={sheet.reload} />
          )
        }
      </AsyncState>
    </div>
  );
};

const initialEntry = (row) =>
  row.record
    ? { status: row.record.status, checkIn: row.record.checkIn ?? '', checkOut: row.record.checkOut ?? '' }
    : { status: row.approvedLeaveId ? 'LEAVE' : 'PRESENT', checkIn: '', checkOut: '' };

const SheetEditor = ({ date, rows, onSaved }) => {
  const { tx } = useI18n();
  const [entries, setEntries] = useState(() => Object.fromEntries(rows.map((r) => [r.teacherId, initialEntry(r)])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const update = (teacherId, patch) => {
    setSaved('');
    setEntries((prev) => ({ ...prev, [teacherId]: { ...prev[teacherId], ...patch } }));
  };

  const markAllPresent = () => {
    setSaved('');
    setEntries((prev) =>
      Object.fromEntries(
        rows.map((r) => [r.teacherId, { ...prev[r.teacherId], status: r.approvedLeaveId ? 'LEAVE' : 'PRESENT' }]),
      ),
    );
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved('');
    try {
      await http.put('/staff-attendance', {
        date,
        entries: rows.map((r) => {
          const e = entries[r.teacherId];
          const timed = e.status === 'PRESENT' || e.status === 'HALF_DAY';
          return {
            teacherId: r.teacherId,
            status: e.status,
            checkIn: timed && e.checkIn ? e.checkIn : null,
            checkOut: timed && e.checkOut ? e.checkOut : null,
          };
        }),
      });
      setSaved('Staff attendance saved.');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const counts = {};
  Object.values(entries).forEach((e) => {
    counts[e.status] = (counts[e.status] || 0) + 1;
  });
  const unmarked = rows.filter((r) => !r.record).length;

  return (
    <>
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STAFF_STATUSES.map((s) => (
            <span key={s} className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${STAFF_STATUS_STYLES[s]}`}>
              {STAFF_STATUS_LABELS[s]}: {counts[s] || 0}
            </span>
          ))}
          {unmarked > 0 && (
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
              {unmarked} not saved yet
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markAllPresent}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#FF6B2C] hover:text-[#FF6B2C] cursor-pointer"
          >
            <UserCheck className="w-4 h-4" /> Mark all present
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-5 py-2 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? tx('Saving…') : tx('Save attendance')}
          </button>
        </div>
      </div>

      {error && (
        <p className="mx-5 sm:mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {saved && (
        <p className="mx-5 sm:mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {saved}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 sm:px-6">Teacher</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Check in</th>
              <th className="py-3 px-4">Check out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const e = entries[r.teacherId];
              const timed = e.status === 'PRESENT' || e.status === 'HALF_DAY';
              return (
                <tr key={r.teacherId} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 sm:px-6">
                    <div className="font-bold text-slate-900">{r.teacherName}</div>
                    <div className="text-[11px] text-slate-400">
                      {r.teacherId}
                      {r.subjects?.length ? ` · ${r.subjects.join(', ')}` : ''}
                    </div>
                    {r.approvedLeaveId && (
                      <span className="mt-1 inline-block rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        Approved leave
                      </span>
                    )}
                    {r.record?.markedBy && (
                      <div className="text-[10px] text-slate-400 mt-0.5">Marked by {r.record.markedBy}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {STAFF_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update(r.teacherId, { status: s })}
                          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${
                            e.status === s ? STAFF_STATUS_STYLES[s] : 'border-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          {STAFF_STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="time"
                      value={e.checkIn}
                      disabled={!timed}
                      onChange={(ev) => update(r.teacherId, { checkIn: ev.target.value })}
                      className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold disabled:opacity-40 focus:border-[#FF6B2C] focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="time"
                      value={e.checkOut}
                      disabled={!timed}
                      onChange={(ev) => update(r.teacherId, { checkOut: ev.target.value })}
                      className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold disabled:opacity-40 focus:border-[#FF6B2C] focus:outline-none"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const monthRange = (month) => {
  const [year, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const last = toIsoDate(new Date(year, m, 0));
  const today = todayIso();
  return { from, to: last > today ? today : last };
};

const MonthlyReport = () => {
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const { from, to } = monthRange(month);
  const report = useApi(from <= to ? withQuery('/staff-attendance/report', { from, to }) : null);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Monthly report</h2>
          <p className="text-xs text-slate-500 mt-1">
            {formatDate(from)} – {formatDate(to)}. Holidays and Sundays are not working days.
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-slate-500">Month</span>
          <input
            type="month"
            value={month}
            max={todayIso().slice(0, 7)}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
          />
        </label>
      </div>
      <AsyncState state={report} loadingText="Loading report…">
        {(rows) =>
          !rows || rows.length === 0 ? (
            <EmptyMessage text="No staff attendance for this month." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Teacher</th>
                    <th className="py-3 px-4 text-right">Working days</th>
                    <th className="py-3 px-4 text-right">Present</th>
                    <th className="py-3 px-4 text-right">Half day</th>
                    <th className="py-3 px-4 text-right">Leave</th>
                    <th className="py-3 px-4 text-right">Absent</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.teacherId} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 sm:px-6">
                        <div className="font-bold text-slate-900">{r.teacherName}</div>
                        <div className="text-[11px] text-slate-400">{r.teacherId}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{r.workingDays}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">{r.present}</td>
                      <td className="py-3 px-4 text-right text-amber-700 font-bold">{r.halfDay}</td>
                      <td className="py-3 px-4 text-right text-sky-700 font-bold">{r.leave}</td>
                      <td className="py-3 px-4 text-right text-rose-700 font-bold">{r.absent}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-extrabold text-slate-900">
                        {r.rate == null ? '—' : `${r.rate}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </AsyncState>
    </div>
  );
};

export default StaffAttendancePage;
