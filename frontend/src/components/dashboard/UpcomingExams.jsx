import React from 'react';
import { FileText, Calendar } from 'lucide-react';
import { upcomingExams } from '@/data/dashboardData';

export const UpcomingExams = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Upcoming Exams
          </h3>
          <span className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer">
            View All
          </span>
        </div>

        <div className="space-y-3">
          {upcomingExams.map((exam, index) => (
            <div
              key={`${exam.id}-${index}`}
              className="bg-[#FFF8F5] border border-orange-100/70 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-orange-100/90 text-[#FF6B2C] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                    {exam.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                    <span>{exam.date}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#FFEBE0] text-[#EA580C] border border-[#FF6B2C]/10 shadow-2xs">
                  {exam.daysRemaining}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
