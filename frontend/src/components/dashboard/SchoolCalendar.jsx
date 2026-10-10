import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, parseIsoDate, toIsoDate } from '@/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Builds the 6-week grid (Sunday first) for the given month. */
const buildMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { iso: toIsoDate(date), day: date.getDate(), isCurrentMonth: date.getMonth() === month };
  });
};

/**
 * Month calendar marking the dates of upcoming exam papers (from GET /dashboard). The backend has no
 * holiday/event calendar yet, so only exam dates are shown.
 */
export const SchoolCalendar = ({ papers = [], today }) => {
  const todayDate = parseIsoDate(today);
  const [view, setView] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });

  const examDates = useMemo(() => new Set(papers.map((p) => p.date)), [papers]);

  // One line per exam (first upcoming paper date), soonest first.
  const events = useMemo(() => {
    const byExam = new Map();
    papers.forEach((p) => {
      const existing = byExam.get(p.examId);
      if (!existing || p.date < existing.date) byExam.set(p.examId, { id: p.examId, title: p.examName, date: p.date });
    });
    return [...byExam.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  }, [papers]);

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view]);

  const shiftMonth = (delta) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange-100/70 text-[#FF6B2C] flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            School Calendar
          </h3>
        </div>

        {/* Month Navigation */}
        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5 mb-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {MONTH_NAMES[view.month]} {view.year}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
              <span key={wd} className="text-[11px] font-semibold text-slate-400">
                {wd}
              </span>
            ))}
          </div>

          {/* Calendar Month Grid */}
          <div className="grid grid-cols-7 gap-y-1.5 text-center">
            {grid.map((item) => {
              let styleClass = 'text-slate-700 font-medium';
              if (!item.isCurrentMonth) styleClass = 'text-slate-300 font-normal';
              if (examDates.has(item.iso)) styleClass = 'bg-orange-100/80 text-[#EA580C] font-bold';
              if (item.iso === today) styleClass = 'bg-[#FF6B2C] text-white font-bold shadow-md shadow-[#FF6B2C]/25';

              return (
                <div key={item.iso} className="flex items-center justify-center py-0.5">
                  <span
                    title={examDates.has(item.iso) ? 'Exam paper scheduled' : undefined}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${styleClass}`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            UPCOMING EXAMS
          </h4>

          {events.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium">Nothing scheduled.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-xs gap-3 p-1.5 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B2C] shrink-0" />
                    <span className="font-semibold text-slate-800 leading-snug truncate">{event.title}</span>
                  </div>
                  <span className="font-semibold text-slate-400 shrink-0">{formatDate(event.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
