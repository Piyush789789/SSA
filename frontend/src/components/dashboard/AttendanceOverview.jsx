import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { addDays, parseIsoDate } from '@/utils';
import { ATTENDED } from '@/components/attendance/attendanceMath';
import { useI18n } from '@/i18n/translate';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Students attending (present or late) on each of the last 7 days, from GET /attendance records.
 * `records` = attendance records covering at least the last 7 days up to `today`.
 */
export const AttendanceOverview = ({ records = [], today }) => {
  const { t } = useI18n();
  const chartData = useMemo(() => {
    const byDate = new Map();
    records.forEach((r) => {
      const entry = byDate.get(r.date) || { attended: 0, marked: 0 };
      if (r.status !== 'holiday') entry.marked += 1;
      if (ATTENDED.has(r.status)) entry.attended += 1;
      byDate.set(r.date, entry);
    });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i - 6);
      const entry = byDate.get(date);
      return {
        day: `${SHORT_DAYS[parseIsoDate(date).getDay()]} ${parseIsoDate(date).getDate()}`,
        students: entry ? entry.attended : 0,
        marked: entry ? entry.marked : 0,
      };
    });
  }, [records, today]);

  const anyMarked = chartData.some((d) => d.marked > 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {t('dash.attendanceOverview')}
        </h3>
        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
          {t('dash.last7Days')}
        </span>
      </div>

      {anyMarked ? (
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B2C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF6B2C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                allowDecimals={false}
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
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value, _name, item) => [
                  `${value} of ${item.payload.marked} marked`,
                  'Students attended',
                ]}
              />
              <Area
                type="monotone"
                dataKey="students"
                stroke="#FF6B2C"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#attendanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-slate-400 font-medium">
          No attendance has been marked in the last 7 days.
        </div>
      )}
    </div>
  );
};
