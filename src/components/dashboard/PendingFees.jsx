import React from 'react';
import { pendingFees } from '@/data/dashboardData';

export const PendingFees = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Pending Fees
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-100">
            10 pending
          </span>
        </div>

        <div className="space-y-3.5">
          {pendingFees.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-start justify-between gap-3 p-2.5 sm:p-3 rounded-2xl hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-amber-100/70 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {item.classExam}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {item.feePeriod}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-orange-100/80 text-[#EA580C]">
                  {item.status}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#E04E15]">
                  {item.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
