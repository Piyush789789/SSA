import React, { useMemo, useState } from 'react';
import { CalendarCheck, TrendingUp, UserCheck, UserX, BookOpen, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { AsyncState } from '@/components/common/AsyncState';
import { addDays, formatDate, parseIsoDate, todayIso, weekdayName } from '@/utils';

const RANGE_LABELS = {
  LAST_30: 'Last 30 Days',
  PREV_30: 'Previous 30 Days',
  THIS_MONTH: 'This Month',
};

/** Colours and labels for each day state. */
const STATUS_STYLES = {
  present: { label: 'Present', cell: 'bg-emerald-500 hover:bg-emerald-600 text-white', badge: 'bg-emerald-100 text-emerald-800', symbol: '✓' },
  absent: { label: 'Absent', cell: 'bg-rose-500 hover:bg-rose-600 text-white', badge: 'bg-rose-100 text-rose-800', symbol: '✕' },
  late: { label: 'Late', cell: 'bg-amber-400 hover:bg-amber-500 text-slate-900', badge: 'bg-amber-100 text-amber-800', symbol: 'L' },
  leave: { label: 'Leave', cell: 'bg-sky-500 hover:bg-sky-600 text-white', badge: 'bg-sky-100 text-sky-800', symbol: 'LV' },
  holiday: { label: 'Holiday', cell: 'bg-violet-400 hover:bg-violet-500 text-white', badge: 'bg-violet-100 text-violet-800', symbol: 'H' },
  unmarked: { label: 'Not marked', cell: 'bg-white border border-dashed border-slate-300 text-slate-400 hover:bg-slate-50', badge: 'bg-slate-100 text-slate-600', symbol: '?' },
  sunday: { label: 'Sunday', cell: 'bg-slate-100 text-slate-300', badge: 'bg-slate-100 text-slate-500', symbol: '—' },
};

const rangeFor = (mode) => {
  const today = todayIso();
  if (mode === 'PREV_30') return { from: addDays(today, -59), to: addDays(today, -30) };
  if (mode === 'THIS_MONTH') return { from: `${today.slice(0, 8)}01`, to: today };
  return { from: addDays(today, -29), to: today };
};

export const StudentAttendancePage = () => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.studentId || currentUser?.id;

  const [dateRangeMode, setDateRangeMode] = useState('LAST_30');
  const [selectedDay, setSelectedDay] = useState(null);

  const { from, to } = useMemo(() => rangeFor(dateRangeMode), [dateRangeMode]);

  const stats = useApi(studentId ? withQuery(`/attendance/students/${studentId}/stats`, { from, to }) : null);
  const records = useApi(studentId ? withQuery('/attendance', { studentId, from, to }) : null);
  const meta = useApi('/meta');

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-[#FF6B2C]" />
            Attendance
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Daily attendance for {currentUser?.name}
            {currentUser?.className ? ` (Class ${currentUser.className})` : ''}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          {Object.entries(RANGE_LABELS).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setDateRangeMode(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateRangeMode === mode ? 'bg-[#FF6B2C] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <AsyncState state={stats} loadingText="Loading attendance statistics…">
        {(s) => {
          const threshold = meta.data?.lowAttendanceThreshold;
          const attended = (s.present ?? 0) + (s.late ?? 0);
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    {s.rate != null ? `${Math.round(s.rate)}%` : '—'}
                  </h3>
                  <p
                    className={`text-[11px] font-semibold mt-1 ${
                      s.rate == null || threshold == null
                        ? 'text-slate-400'
                        : s.rate >= threshold
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {s.rate == null
                      ? 'No days marked'
                      : threshold == null
                        ? RANGE_LABELS[dateRangeMode]
                        : s.rate >= threshold
                          ? `At or above ${threshold}% target`
                          : `Below ${threshold}% target`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Present</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{attended}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Days attended{s.late ? ` (${s.late} late)` : ''}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Absent</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{s.absent ?? 0}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Days missed{s.leave ? ` • ${s.leave} on leave` : ''}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <UserX className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Working Days</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{s.workingDays ?? 0}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Marked days (holidays excluded)</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        }}
      </AsyncState>

      {/* Day calendar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Daily Attendance ({RANGE_LABELS[dateRangeMode]})
            </h2>
            <p className="text-xs text-slate-500">
              {formatDate(from)} – {formatDate(to)}. Click a day to see its details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            {Object.entries(STATUS_STYLES).map(([key, style]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-md ${style.cell.split(' hover:')[0]}`} />
                <span className="text-slate-700">{style.label}</span>
              </div>
            ))}
          </div>
        </div>

        <AsyncState state={records} loadingText="Loading attendance records…">
          {(list) => <DayCalendar from={from} to={to} records={list} onSelect={setSelectedDay} />}
        </AsyncState>
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                    STATUS_STYLES[selectedDay.status].cell
                  }`}
                >
                  {STATUS_STYLES[selectedDay.status].symbol}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{STATUS_STYLES[selectedDay.status].label}</h3>
                  <p className="text-xs text-slate-500">
                    {weekdayName(selectedDay.date)}, {formatDate(selectedDay.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedDay.date)}</span>
              </div>
              {selectedDay.record ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-in time:</span>
                    <span className="font-semibold text-slate-800">{selectedDay.record.checkInTime || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Marked by:</span>
                    <span className="font-semibold text-slate-800">{selectedDay.record.markedBy || '—'}</span>
                  </div>
                  {selectedDay.record.remarks && (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Remarks:</span>
                      <span className="font-semibold text-slate-800 text-right">{selectedDay.record.remarks}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500">Attendance has not been marked for this day.</p>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Attendance Status:</span>
                <span
                  className={`font-black uppercase text-xs px-2.5 py-0.5 rounded-full ${
                    STATUS_STYLES[selectedDay.status].badge
                  }`}
                >
                  {STATUS_STYLES[selectedDay.status].label}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedDay(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Calendar of every day from `from` to `to`, aligned to weekdays. */
const DayCalendar = ({ from, to, records, onSelect }) => {
  const days = useMemo(() => {
    const byDate = new Map((records || []).map((r) => [r.date, r]));
    const list = [];
    for (let date = from; date <= to; date = addDays(date, 1)) {
      const record = byDate.get(date);
      const isSunday = parseIsoDate(date).getDay() === 0;
      const status = record ? record.status : isSunday ? 'sunday' : 'unmarked';
      list.push({ date, record, status: STATUS_STYLES[status] ? status : 'unmarked' });
    }
    return list;
  }, [from, to, records]);

  const leadingBlanks = parseIsoDate(from).getDay();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 max-w-2xl">
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase text-slate-400">
            {d}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const style = STATUS_STYLES[day.status];
          const dayNum = Number(day.date.slice(8, 10));
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelect(day)}
              title={`${formatDate(day.date)} – ${style.label}`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center font-bold shadow-2xs transition-all cursor-pointer hover:scale-105 ${style.cell}`}
            >
              <span className="text-xs sm:text-sm leading-none">{dayNum}</span>
              <span className="text-[9px] leading-none mt-0.5 opacity-80">{style.symbol}</span>
            </button>
          );
        })}
      </div>
      {records.length === 0 && (
        <p className="text-xs text-slate-500">No attendance has been recorded in this period yet.</p>
      )}
    </div>
  );
};

export default StudentAttendancePage;
