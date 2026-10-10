import React, { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { todayIso, weekdayName } from '@/utils';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const dayLabel = (day) => day.charAt(0) + day.slice(1).toLowerCase();

// Colour per subject (UI only), picked by a stable hash of the subject name.
const SUBJECT_COLORS = [
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900' },
];
const colorFor = (subject = '') => {
  let hash = 0;
  for (const ch of subject) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
};

export const TeacherTimetablePage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Week'); // 'Week' | 'Day'
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = weekdayName(todayIso()).toUpperCase();
    return DAYS.includes(today) ? today : 'MONDAY';
  });

  const entries = useApi(currentUser?.id ? `/timetable/teachers/${encodeURIComponent(currentUser.id)}` : null);
  const periods = useApi('/timetable/periods');

  const periodsList = useMemo(() => (periods.data ?? []).filter((p) => p.type === 'period'), [periods.data]);
  const findEntry = (day, periodId) => (entries.data ?? []).find((e) => e.day === day && e.periodId === periodId);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>My Schedule & Timetable</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Weekly teaching schedule for {currentUser?.name} across assigned classes
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          {[
            ['Week', 'Weekly Schedule'],
            ['Day', 'Daily View'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === key ? 'bg-white text-[#FF6B2C] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Day' && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDay === day ? 'bg-[#FF6B2C] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {dayLabel(day)}
            </button>
          ))}
        </div>
      )}

      <AsyncState state={[entries, periods]} loadingText="Loading timetable…">
        {() =>
          periodsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80">
              <EmptyMessage text="The school's period timings have not been set up yet." />
            </div>
          ) : activeTab === 'Week' ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {(entries.data ?? []).length === 0 && (
                <p className="px-4 pt-4 text-xs text-slate-500">No periods are assigned to you in the timetable yet.</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 w-28">Time / Day</th>
                      {DAYS.map((day) => (
                        <th key={day} className="py-3.5 px-4 min-w-[150px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodsList.map((period) => (
                      <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 bg-slate-50/60 font-bold text-slate-700 text-[11px]">
                          <p>{period.label}</p>
                          <p className="text-slate-400 font-medium text-[10px] mt-0.5">
                            {period.startTime} - {period.endTime}
                          </p>
                        </td>

                        {DAYS.map((day) => {
                          const entry = findEntry(day, period.id);
                          if (!entry) {
                            return (
                              <td key={day} className="py-3 px-3">
                                <div className="h-14 rounded-xl border border-dashed border-slate-200/80 flex items-center justify-center text-[11px] text-slate-300 font-medium">
                                  Free
                                </div>
                              </td>
                            );
                          }
                          const color = colorFor(entry.subject);
                          return (
                            <td key={day} className="py-3 px-3">
                              <div
                                className={`p-3 rounded-xl border shadow-xs flex flex-col justify-between h-full space-y-1 ${color.bg} ${color.border}`}
                              >
                                <span className="font-extrabold text-slate-900 text-xs">Class {entry.className}</span>
                                <p className={`font-bold text-xs ${color.text}`}>{entry.subject}</p>
                                <p className="text-[10px] text-slate-500 font-semibold">{entry.room || '—'}</p>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Teaching Schedule for {dayLabel(selectedDay)}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {periodsList.map((period) => {
                  const entry = findEntry(selectedDay, period.id);
                  if (!entry) {
                    return (
                      <div
                        key={period.id}
                        className="p-5 bg-white rounded-2xl border border-slate-200/60 flex items-center justify-between text-slate-400 opacity-60"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-500">{period.label}</span>
                          <p className="text-[11px] mt-0.5">
                            {period.startTime} - {period.endTime}
                          </p>
                        </div>
                        <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-xl">Free Period</span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={period.id}
                      className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-orange-200 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-orange-100 text-[#FF6B2C] font-extrabold rounded-xl text-xs">
                          Class {entry.className}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {period.startTime} - {period.endTime}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{entry.subject}</h4>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {period.label}
                          {entry.room ? ` • ${entry.room}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        }
      </AsyncState>
    </div>
  );
};

export default TeacherTimetablePage;
