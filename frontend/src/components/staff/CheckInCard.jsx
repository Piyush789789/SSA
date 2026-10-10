import React, { useState } from 'react';
import { AlertCircle, CalendarOff, Fingerprint, Loader2, LogIn, LogOut } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { ErrorMessage, LoadingMessage } from '@/components/common/AsyncState';
import { formatDate, todayIso, weekdayName } from '@/utils';
import { STAFF_STATUS_LABELS } from './staffStatus';
import { StaffStatusBadge } from './StaffStatusBadge';

/** Teacher's own check-in / check-out for today. `onChange` runs after a successful check-in or check-out. */
export const CheckInCard = ({ onChange }) => {
  const today = todayIso();
  const records = useApi(withQuery('/staff-attendance/records', { from: today, to: today }));
  const holiday = useApi(withQuery('/calendar/check', { date: today }));
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const record = (records.data ?? []).find((r) => r.date === today) ?? null;

  const act = async (kind) => {
    setBusy(kind);
    setError('');
    try {
      await http.post(`/staff-attendance/${kind}`);
      records.reload();
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const away = record && (record.status === 'ABSENT' || record.status === 'LEAVE');

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-[#FF6B2C]" />
            <span>My Attendance Today</span>
          </h2>
          <p className="text-xs text-slate-500">
            {weekdayName(today)}, {formatDate(today)}
          </p>
        </div>
        {record && <StaffStatusBadge status={record.status} />}
      </div>

      {records.error && !records.data ? (
        <ErrorMessage error={records.error} onRetry={records.reload} />
      ) : records.loading || holiday.loading ? (
        <LoadingMessage text="Checking today's record…" />
      ) : holiday.data?.holiday && !record ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          <CalendarOff className="w-5 h-5 shrink-0" />
          <span>Holiday{holiday.data.title ? ` — ${holiday.data.title}` : ''}. No check-in needed today.</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="grid grid-cols-2 gap-3 flex-1 max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Check in</p>
              <p className="text-lg font-extrabold text-slate-900">{record?.checkIn || '—'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Check out</p>
              <p className="text-lg font-extrabold text-slate-900">{record?.checkOut || '—'}</p>
            </div>
          </div>

          {away ? (
            <p className="text-xs font-semibold text-slate-500">
              Marked {STAFF_STATUS_LABELS[record.status]?.toLowerCase()} for today.
            </p>
          ) : (
            <div className="flex gap-2">
              {!record?.checkIn && (
                <button
                  type="button"
                  onClick={() => act('check-in')}
                  disabled={busy != null}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-[#FF6B2C]/20 disabled:opacity-60 cursor-pointer"
                >
                  {busy === 'check-in' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Check in
                </button>
              )}
              {record?.checkIn && !record?.checkOut && (
                <button
                  type="button"
                  onClick={() => act('check-out')}
                  disabled={busy != null}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {busy === 'check-out' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Check out
                </button>
              )}
              {record?.checkIn && record?.checkOut && (
                <p className="text-xs font-semibold text-emerald-600">Done for today.</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};

export default CheckInCard;
