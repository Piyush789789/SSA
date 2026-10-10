import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MonthlyAttendanceTable = ({ monthlyData }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Monthly Student Attendance Overview (September 2026)
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {monthlyData.length} students listed
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Class</th>
              <th className="py-2.5 px-3">Roll No</th>
              <th className="py-2.5 px-3">Student ID</th>
              <th className="py-2.5 px-3 text-center">Present</th>
              <th className="py-2.5 px-3 text-center">Absent</th>
              <th className="py-2.5 px-3 text-center">Late</th>
              <th className="py-2.5 px-3 text-center">Leave</th>
              <th className="py-2.5 px-3 text-center">Working Days</th>
              <th className="py-2.5 px-3 text-center">Attendance %</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {monthlyData.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-400 font-medium">
                  No monthly student attendance records match the selected filters.
                </td>
              </tr>
            ) : (
              monthlyData.map((row) => (
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
                  <td className="py-3 px-3 text-slate-400 font-medium">
                    {row.student.id}
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">
                    {row.presentDays}
                  </td>
                  <td className="py-3 px-3 text-center text-rose-600 font-bold">
                    {row.absentDays}
                  </td>
                  <td className="py-3 px-3 text-center text-amber-600 font-bold">
                    {row.lateDays}
                  </td>
                  <td className="py-3 px-3 text-center text-sky-600 font-bold">
                    {row.leaveDays}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700">
                    {row.totalWorkingDays}
                  </td>
                  <td className="py-3 px-3 text-center font-black">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs ${
                        Number(row.rate) >= 90
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : Number(row.rate) >= 75
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {row.rate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-[#FF6B2C] transition-colors">
                      Details <ChevronRight className="w-3.5 h-3.5" />
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
