import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { CheckInCard } from '@/components/staff/CheckInCard';
import { STAFF_STATUS_LABELS } from '@/components/staff/staffStatus';
import { StaffStatusBadge } from '@/components/staff/StaffStatusBadge';
import { addDays, formatDate, todayIso, weekdayName } from '@/utils';
import { useI18n } from '@/i18n/translate';

/** /teacher/my-attendance — check in/out today and the teacher's own attendance history. */
export const TeacherMyAttendancePage = () => {
  const { tx } = useI18n();
  const today = todayIso();
  const [from, setFrom] = useState(addDays(today, -29));
  const [to, setTo] = useState(today);
  const records = useApi(withQuery('/staff-attendance/records', { from, to }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Fingerprint className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>{tx('My Attendance')}</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Check in when you arrive and check out when you leave. Your history is below.
        </p>
      </div>

      <CheckInCard onChange={records.reload} />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">History</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-slate-500">From</span>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-slate-500">To</span>
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
              />
            </label>
          </div>
        </div>

        <AsyncState state={records} loadingText="Loading your attendance…">
          {(list) => {
            const rows = [...(list ?? [])].sort((a, b) => b.date.localeCompare(a.date));
            if (rows.length === 0) return <EmptyMessage text="No attendance recorded in this period." />;
            const counts = {};
            rows.forEach((r) => {
              counts[r.status] = (counts[r.status] || 0) + 1;
            });
            return (
              <>
                <div className="flex flex-wrap gap-2 px-5 sm:px-6 py-4 border-b border-slate-100">
                  {Object.entries(STAFF_STATUS_LABELS).map(([status, label]) => (
                    <span key={status} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                      {label}: {counts[status] || 0}
                    </span>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 sm:px-6">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Check in</th>
                        <th className="py-3 px-4">Check out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r) => (
                        <tr key={r.id ?? r.date} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">
                            {weekdayName(r.date).slice(0, 3)}, {formatDate(r.date)}
                          </td>
                          <td className="py-3 px-4">
                            <StaffStatusBadge status={r.status} />
                          </td>
                          <td className="py-3 px-4 text-slate-600">{r.checkIn || '—'}</td>
                          <td className="py-3 px-4 text-slate-600">{r.checkOut || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          }}
        </AsyncState>
      </div>
    </div>
  );
};

export default TeacherMyAttendancePage;
