import React from 'react';
import { Users, CheckCircle2, XCircle, Clock, CalendarOff, Percent } from 'lucide-react';

export const AttendanceSummary = ({ summary }) => {
  const { totalStudents, present, absent, late, leave, attendanceRate } = summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
      {/* 1. Total Students */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
          <Users className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
            {totalStudents}
          </h3>
        </div>
      </div>

      {/* 2. Present */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</p>
          <h3 className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight mt-0.5">
            {present}
          </h3>
        </div>
      </div>

      {/* 3. Absent */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
          <XCircle className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</p>
          <h3 className="text-lg sm:text-xl font-black text-rose-600 tracking-tight mt-0.5">
            {absent}
          </h3>
        </div>
      </div>

      {/* 4. Late */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
          <Clock className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Late</p>
          <h3 className="text-lg sm:text-xl font-black text-amber-600 tracking-tight mt-0.5">
            {late}
          </h3>
        </div>
      </div>

      {/* 5. Leave */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
          <CalendarOff className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave</p>
          <h3 className="text-lg sm:text-xl font-black text-sky-600 tracking-tight mt-0.5">
            {leave || 0}
          </h3>
        </div>
      </div>

      {/* 6. Attendance Rate */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0 border border-orange-100">
          <Percent className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate %</p>
          <h3 className="text-lg sm:text-xl font-black text-[#FF6B2C] tracking-tight mt-0.5">
            {attendanceRate}%
          </h3>
        </div>
      </div>
    </div>
  );
};
