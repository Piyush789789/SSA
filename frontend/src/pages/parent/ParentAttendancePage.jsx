import React, { useState, useMemo } from 'react';
import { CalendarCheck, TrendingUp, UserCheck, UserX, BookOpen, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { addDays, formatDate, parseIsoDate, todayIso, weekdayName } from '@/utils';
import { useI18n } from '@/i18n/translate';

const STATUS_META = {
  present: { label: 'Present', symbol: '✓', cell: 'bg-emerald-500 hover:bg-emerald-600 text-white', badge: 'bg-emerald-100 text-emerald-800', icon: 'bg-emerald-500 text-white' },
  absent: { label: 'Absent', symbol: '✕', cell: 'bg-rose-500 hover:bg-rose-600 text-white', badge: 'bg-rose-100 text-rose-800', icon: 'bg-rose-500 text-white' },
  late: { label: 'Late', symbol: 'L', cell: 'bg-amber-400 hover:bg-amber-500 text-slate-900', badge: 'bg-amber-100 text-amber-800', icon: 'bg-amber-400 text-slate-900' },
  leave: { label: 'Leave', symbol: 'LV', cell: 'bg-sky-500 hover:bg-sky-600 text-white', badge: 'bg-sky-100 text-sky-800', icon: 'bg-sky-500 text-white' },
  holiday: { label: 'Holiday', symbol: 'H', cell: 'bg-violet-400 hover:bg-violet-500 text-white', badge: 'bg-violet-100 text-violet-800', icon: 'bg-violet-400 text-white' },
};

const RANGES = {
  LAST_30: { label: 'Last 30 days', offset: 0 },
  PREV_30: { label: 'Previous 30 days', offset: 30 },
};

const shortDate = (iso) => formatDate(iso).split(' ').slice(0, 2).join(' ');

export const ParentAttendancePage = () => {
  const { tx } = useI18n();
  const { currentUser, selectedChild, switchChild } = useAuth();
  const linkedChildren = currentUser?.linkedChildren || [];
  const childId = selectedChild?.studentId ?? null;

  const [dateRangeMode, setDateRangeMode] = useState('LAST_30');
  const [selectedCell, setSelectedCell] = useState(null);

  const today = todayIso();
  const to = addDays(today, -RANGES[dateRangeMode].offset);
  const from = addDays(to, -29);

  const records = useApi(childId ? withQuery('/attendance', { studentId: childId, from, to }) : null);
  const rangeStats = useApi(
    childId ? withQuery(`/attendance/students/${encodeURIComponent(childId)}/stats`, { from, to }) : null,
  );
  const overallStats = useApi(childId ? `/attendance/students/${encodeURIComponent(childId)}/stats` : null);

  // One column per day of the range, oldest first.
  const dateColumns = useMemo(() => {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const iso = addDays(to, -i);
      dates.push({
        dateStr: iso,
        displayDate: shortDate(iso),
        dayName: weekdayName(iso).slice(0, 3),
        isSunday: parseIsoDate(iso).getDay() === 0,
      });
    }
    return dates;
  }, [to]);

  const recordsByDate = useMemo(() => {
    const map = {};
    (records.data || []).forEach((r) => {
      map[r.date] = r;
    });
    return map;
  }, [records.data]);

  if (!selectedChild) {
    return <EmptyMessage text="No child is linked to this parent account yet." />;
  }

  const cardStats = rangeStats.data;
  const overallRate = overallStats.data?.rate;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Child Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-[#FF6B2C]" />
            {tx('Child Attendance Report')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Daily attendance for {selectedChild.name} (Class {selectedChild.className}), {formatDate(from)} –{' '}
            {formatDate(to)}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-2xs">
            {Object.entries(RANGES).map(([key, range]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDateRangeMode(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  dateRangeMode === key ? 'bg-[#FF6B2C] text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Child Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
            <select
              value={selectedChild.studentId}
              onChange={(e) => switchChild(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer pr-3"
            >
              {linkedChildren.map((child) => (
                <option key={child.studentId} value={child.studentId}>
                  {child.name} ({child.className})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <AsyncState state={rangeStats} loadingText="Loading attendance summary…">
        {() => (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Attendance Rate */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {cardStats?.rate == null ? '—' : `${cardStats.rate}%`}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  {overallRate == null ? 'This period' : `This year so far: ${overallRate}%`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Present */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Present</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{cardStats?.present ?? 0}</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Days attended{cardStats?.late ? ` (+${cardStats.late} late)` : ''}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Absent */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Absent</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{cardStats?.absent ?? 0}</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Days absent{cardStats?.leave ? ` (+${cardStats.leave} on leave)` : ''}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <UserX className="w-6 h-6" />
              </div>
            </div>

            {/* Working Days */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Working Days</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {cardStats?.workingDays ?? 0}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Days with attendance marked</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}
      </AsyncState>

      {/* Day Grid Attendance Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Daily Attendance Grid ({RANGES[dateRangeMode].label})
            </h2>
            <p className="text-xs text-slate-500">Click any day to see check-in time, remarks and who marked it.</p>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-md shadow-2xs ${meta.cell.split(' ')[0]}`} />
                <span className="text-slate-700">{meta.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-200" />
              <span className="text-slate-400">Not marked / Sunday</span>
            </div>
          </div>
        </div>

        <AsyncState state={records} loadingText="Loading attendance…">
          {(list) => (
            <>
              <div className="relative overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="border-collapse text-left text-xs min-w-full">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200">
                      <th className="sticky left-0 z-20 bg-slate-100 py-3.5 px-4 font-bold text-slate-700 shadow-sm min-w-[160px]">
                        Student
                      </th>
                      {dateColumns.map((col) => (
                        <th
                          key={col.dateStr}
                          className={`py-3 px-2 text-center font-bold min-w-[50px] border-l border-slate-200/60 ${
                            col.isSunday ? 'bg-slate-100/60 text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          <div className="text-[11px] font-extrabold whitespace-nowrap">{col.displayDate}</div>
                          <div className="text-[9px] uppercase font-semibold text-slate-400">{col.dayName}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="sticky left-0 z-10 bg-white py-3.5 px-4 border-r border-slate-200/80 shadow-xs">
                        <span className="block text-xs sm:text-sm font-bold text-slate-800">{selectedChild.name}</span>
                        <span className="block text-[10px] text-slate-400 font-medium">
                          Class {selectedChild.className} • Roll #{selectedChild.rollNumber}
                        </span>
                      </td>
                      {dateColumns.map((col) => {
                        const record = recordsByDate[col.dateStr];
                        const meta = record ? STATUS_META[record.status] : null;
                        return (
                          <td
                            key={col.dateStr}
                            className={`py-2 px-2 text-center border-l border-slate-100 ${
                              col.isSunday ? 'bg-slate-50/50' : ''
                            }`}
                          >
                            {meta ? (
                              <button
                                type="button"
                                onClick={() => setSelectedCell({ ...record, dayName: weekdayName(col.dateStr) })}
                                className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-[10px] font-bold shadow-xs hover:scale-110 transition-all cursor-pointer ${meta.cell}`}
                                title={`${meta.label} on ${col.displayDate}`}
                              >
                                {meta.symbol}
                              </button>
                            ) : (
                              <div
                                className="w-7 h-7 mx-auto rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-300 font-bold"
                                title={col.isSunday ? 'Sunday' : 'Not marked'}
                              >
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              {(list || []).length === 0 && (
                <p className="text-xs text-slate-500">No attendance has been marked for this period yet.</p>
              )}
            </>
          )}
        </AsyncState>
      </div>

      {/* Attendance Day Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                    STATUS_META[selectedCell.status]?.icon || 'bg-slate-200'
                  }`}
                >
                  {STATUS_META[selectedCell.status]?.symbol}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Daily Attendance</h3>
                  <p className="text-xs text-slate-500">
                    {selectedCell.dayName}, {formatDate(selectedCell.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2.5">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800 text-right">
                  {selectedChild.name} (Class {selectedCell.className})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Check-in Time:</span>
                <span className="font-semibold text-slate-800">{selectedCell.checkInTime || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marked By:</span>
                <span className="font-semibold text-slate-800">{selectedCell.markedBy || '—'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`font-black uppercase text-xs px-2.5 py-0.5 rounded-full ${
                    STATUS_META[selectedCell.status]?.badge || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {STATUS_META[selectedCell.status]?.label || selectedCell.status}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 font-bold block mb-0.5">Remarks / Note:</span>
                <p className="text-slate-700 italic text-xs">{selectedCell.remarks || 'No remarks.'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedCell(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {tx('Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAttendancePage;
