import React from 'react';
import { CalendarDays } from 'lucide-react';
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { useI18n } from '@/i18n/translate';

/** /teacher/calendar, /student/calendar, /parent/calendar — read-only school holiday & event calendar. */
export const CalendarPage = () => {
  const { tx } = useI18n();
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <CalendarDays className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>{tx('School Calendar')}</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Holidays and school events. Sundays are holidays.</p>
      </div>
      <EventCalendar />
    </div>
  );
};

export default CalendarPage;
