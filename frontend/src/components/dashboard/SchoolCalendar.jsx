import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { upcomingEvents } from '@/data/dashboardData';

export const SchoolCalendar = () => {
  // Calendar dates for August 2026 layout matching screenshot
  // Prev month Jul: 26, 27, 28, 29, 30, 31
  // Current Aug: 1 - 31
  // Next month Sep: 1, 2, 3, 4, 5
  const calendarDays = [
    { day: 26, isCurrentMonth: false },
    { day: 27, isCurrentMonth: false },
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 31, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true, isHighlighted: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true, isHighlighted: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true, isActive: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true, isHighlighted: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true, isHighlighted: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true, isHighlighted: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true, isHighlighted: true },
    { day: 29, isCurrentMonth: true, isHighlighted: true },
    { day: 30, isCurrentMonth: true },
    { day: 31, isCurrentMonth: true },
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
    { day: 3, isCurrentMonth: false, isHighlighted: true },
    { day: 4, isCurrentMonth: false },
    { day: 5, isCurrentMonth: false },
  ];

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
              className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              August 2026
            </span>
            <button
              type="button"
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
            {calendarDays.map((item, idx) => {
              let styleClass = 'text-slate-700 font-medium hover:bg-slate-200/50';

              if (!item.isCurrentMonth) {
                styleClass = 'text-slate-300 font-normal';
              }

              if (item.isHighlighted) {
                styleClass = 'bg-orange-100/80 text-[#EA580C] font-bold';
              }

              if (item.isActive) {
                styleClass = 'bg-[#FF6B2C] text-white font-bold shadow-md shadow-[#FF6B2C]/25';
              }

              return (
                <div key={idx} className="flex items-center justify-center py-0.5">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer ${styleClass}`}
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
            UPCOMING
          </h4>

          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-xs gap-3 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B2C] shrink-0" />
                  <span className="font-semibold text-slate-800 leading-snug truncate">
                    {event.title}
                  </span>
                </div>
                <span className="font-semibold text-slate-400 shrink-0">
                  {event.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
