import React, { useMemo } from 'react';
import { TrendingUp, Calendar, Award, AlertCircle } from 'lucide-react';
import { formatDate } from '@/utils';
import { formatRate, groupBy, summarizeRecords } from './attendanceMath';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Daily / weekly view: attendance rate for each day Monday–Saturday of the shown week.
 * Monthly view: best / worst day and number of working days, from the month's records.
 */
export const AttendanceTrend = ({ viewMode, records = [], weekDates = [], periodLabel }) => {
  const byDate = useMemo(() => groupBy(records, (r) => r.date), [records]);

  const weeklyData = useMemo(
    () =>
      weekDates.map((date, i) => ({
        day: DAY_LABELS[i],
        date,
        rate: summarizeRecords(byDate.get(date) || []).rate,
      })),
    [weekDates, byDate],
  );

  const monthlyStats = useMemo(() => {
    const days = [...byDate.entries()]
      .map(([date, list]) => ({ date, rate: summarizeRecords(list).rate }))
      .filter((d) => d.rate !== null);
    if (days.length === 0) return null;
    const sorted = [...days].sort((a, b) => b.rate - a.rate || a.date.localeCompare(b.date));
    return {
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
      workingDays: days.length,
      average: summarizeRecords(records).rate,
    };
  }, [byDate, records]);

  // The daily view also loads the week, so it reuses the weekly chart.
  const showWeekly = viewMode !== 'monthly';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              {showWeekly ? 'Weekly Attendance Overview' : 'Monthly Attendance Trend'}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">
              {showWeekly && weekDates.length
                ? `${formatDate(weekDates[0])} – ${formatDate(weekDates[weekDates.length - 1])}`
                : periodLabel}
            </p>
          </div>
        </div>

        {!showWeekly && monthlyStats && (
          <span className="text-xs font-bold text-[#FF6B2C] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
            Avg: {formatRate(monthlyStats.average)}
          </span>
        )}
      </div>

      {showWeekly ? (
        <div className="grid grid-cols-6 gap-2 sm:gap-4 pt-2">
          {weeklyData.map((item) => (
            <div key={item.day} className="flex flex-col items-center space-y-2 group" title={formatDate(item.date)}>
              <span className="text-[11px] font-extrabold text-[#FF6B2C] group-hover:scale-110 transition-transform">
                {item.rate === null ? '—' : `${Math.round(item.rate)}%`}
              </span>
              <div className="w-full bg-slate-100 rounded-2xl h-28 sm:h-36 flex items-end p-1">
                <div
                  style={{ height: `${item.rate || 0}%` }}
                  className="w-full bg-gradient-to-t from-[#FF6B2C] to-[#ff8c5a] rounded-xl transition-all duration-300 group-hover:brightness-110"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600">{item.day}</span>
            </div>
          ))}
        </div>
      ) : !monthlyStats ? (
        <p className="text-sm text-slate-400 font-medium py-6 text-center">No attendance marked in this month.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-3">
            <Award className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Highest Day</p>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                {formatDate(monthlyStats.highest.date)} ({formatRate(monthlyStats.highest.rate)})
              </h4>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">Lowest Day</p>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                {formatDate(monthlyStats.lowest.date)} ({formatRate(monthlyStats.lowest.rate)})
              </h4>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-indigo-800 tracking-wider">Days Marked</p>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                {monthlyStats.workingDays} Days
              </h4>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
