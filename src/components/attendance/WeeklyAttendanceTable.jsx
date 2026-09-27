import React from 'react';
import { CalendarRange, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const renderStatusCell = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'present') {
    return (
      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-[11px] flex items-center justify-center border border-emerald-200 mx-auto">
        P
      </span>
    );
  }
  if (s === 'absent') {
    return (
      <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 font-extrabold text-[11px] flex items-center justify-center border border-rose-200 mx-auto">
        A
      </span>
    );
  }
  if (s === 'late') {
    return (
      <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 font-extrabold text-[11px] flex items-center justify-center border border-amber-200 mx-auto">
        L
      </span>
    );
  }
  if (s === 'leave') {
    return (
      <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 font-extrabold text-[11px] flex items-center justify-center border border-sky-200 mx-auto">
        LV
      </span>
    );
  }
  if (s === 'holiday') {
    return (
      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 font-extrabold text-[11px] flex items-center justify-center border border-slate-200 mx-auto">
        H
      </span>
    );
  }
  return (
    <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 font-medium text-[11px] flex items-center justify-center border border-slate-200/60 mx-auto">
      —
    </span>
  );
};

export const WeeklyAttendanceTable = ({ weeklyData }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
            <CalendarRange className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Weekly Student Attendance Breakdown (21 Sep – 26 Sep 2026)
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {weeklyData.length} students listed
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Class</th>
              <th className="py-2.5 px-3">Roll</th>
              <th className="py-2.5 px-3 text-center">Mon</th>
              <th className="py-2.5 px-3 text-center">Tue</th>
              <th className="py-2.5 px-3 text-center">Wed</th>
              <th className="py-2.5 px-3 text-center">Thu</th>
              <th className="py-2.5 px-3 text-center">Fri</th>
              <th className="py-2.5 px-3 text-center">Sat</th>
              <th className="py-2.5 px-3 text-center">Weekly %</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {weeklyData.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-400 font-medium">
                  No weekly student attendance records match the selected filters.
                </td>
              </tr>
            ) : (
              weeklyData.map((row) => (
                <tr
                  key={row.student.id}
                  onClick={() => navigate(`/admin/attendance/student/${row.student.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-bold text-slate-900 group-hover:text-[#FF6B2C] transition-colors">
                    {row.student.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-semibold">
                    {row.student.className}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {row.student.rollNumber}
                  </td>
                  <td className="py-3 px-3 text-center">{renderStatusCell(row.mon)}</td>
                  <td className="py-3 px-3 text-center">{renderStatusCell(row.tue)}</td>
                  <td className="py-3 px-3 text-center">{renderStatusCell(row.wed)}</td>
                  <td className="py-3 px-3 text-center">{renderStatusCell(row.thu)}</td>
                  <td className="py-3 px-3 text-center">{renderStatusCell(row.fri)}</td>
                  <td className="py-3 px-3 text-center">{renderStatusCell(row.sat)}</td>
                  <td className="py-3 px-3 text-center font-black text-slate-900">
                    <span className={`px-2 py-0.5 rounded-md ${
                      Number(row.rate) >= 90
                        ? 'bg-emerald-50 text-emerald-700'
                        : Number(row.rate) >= 75
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {row.rate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-[#FF6B2C] transition-colors">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
