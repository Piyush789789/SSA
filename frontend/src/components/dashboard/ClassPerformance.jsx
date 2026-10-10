import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { groupBy, summarizeRecords } from '@/components/attendance/attendanceMath';

/**
 * Attendance rate per class, worked out from the attendance records passed in (the dashboard
 * loads the last 30 days). Classes with no marked days are left out.
 */
export const ClassPerformance = ({ records = [], periodLabel = 'Last 30 days' }) => {
  const chartData = useMemo(() => {
    const byClass = groupBy(records, (r) => r.className);
    return [...byClass.entries()]
      .map(([className, list]) => ({ class: className, score: summarizeRecords(list).rate }))
      .filter((row) => row.score !== null)
      .sort((a, b) => a.class.localeCompare(b.class, undefined, { numeric: true }));
  }, [records]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Class Attendance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Attendance rate by class (late counts as attended)</p>
        </div>
        <span className="text-xs font-semibold text-[#FF6B2C] bg-[#FFF5F0] px-2.5 py-1 rounded-lg border border-[#FF6B2C]/20">
          {periodLabel}
        </span>
      </div>

      {chartData.length > 0 ? (
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="class"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
                formatter={(value) => [`${value}%`, 'Attendance']}
              />
              <Bar dataKey="score" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-slate-400 font-medium">
          No attendance marked for any class in this period.
        </div>
      )}
    </div>
  );
};
