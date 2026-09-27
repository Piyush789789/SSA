import React from 'react';
import { TrendingUp, Calendar, Award, AlertCircle } from 'lucide-react';

export const AttendanceTrend = ({ viewMode }) => {
  const weeklyData = [
    { day: 'MON', percent: 91 },
    { day: 'TUE', percent: 93 },
    { day: 'WED', percent: 89 },
    { day: 'THU', percent: 94 },
    { day: 'FRI', percent: 92 },
    { day: 'SAT', percent: 90 },
  ];

  const monthlyStats = {
    highestDay: '24 Sep 2026 (96%)',
    lowestDay: '18 Sep 2026 (84%)',
    workingDays: 24,
    avgAttendance: '91.8%',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              {viewMode === 'monthly' ? 'Monthly Attendance Trend' : 'Weekly Attendance Overview'}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">
              {viewMode === 'monthly' ? 'September 2026' : '21 Sep – 26 Sep 2026'}
            </p>
          </div>
        </div>

        {viewMode === 'monthly' && (
          <span className="text-xs font-bold text-[#FF6B2C] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
            Avg: {monthlyStats.avgAttendance}
          </span>
        )}
      </div>

      {viewMode === 'weekly' ? (
        /* Weekly Bar Chart */
        <div className="grid grid-cols-6 gap-2 sm:gap-4 pt-2">
          {weeklyData.map((item) => (
            <div key={item.day} className="flex flex-col items-center space-y-2 group">
              <span className="text-[11px] font-extrabold text-[#FF6B2C] group-hover:scale-110 transition-transform">
                {item.percent}%
              </span>
              <div className="w-full bg-slate-100 rounded-2xl h-28 sm:h-36 flex items-end p-1">
                <div
                  style={{ height: `${item.percent}%` }}
                  className="w-full bg-gradient-to-t from-[#FF6B2C] to-[#ff8c5a] rounded-xl transition-all duration-300 group-hover:brightness-110"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600">{item.day}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Monthly Highlights */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-3">
            <Award className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
                Highest Day
              </p>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                {monthlyStats.highestDay}
              </h4>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                Lowest Day
              </p>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                {monthlyStats.lowestDay}
              </h4>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-indigo-800 tracking-wider">
                Working Days
              </p>
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
