import React from 'react';
import { UserCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

export const DailyAttendanceTable = ({ dailyData }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Daily Student Attendance Roster
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {dailyData.length} students listed
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Class</th>
              <th className="py-2.5 px-3">Roll No.</th>
              <th className="py-2.5 px-3">Student ID</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Check-in Time</th>
              <th className="py-2.5 px-3">Remarks</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {dailyData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                  No student attendance records match the selected filters.
                </td>
              </tr>
            ) : (
              dailyData.map((row) => (
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
                  <td className="py-3 px-3">
                    <AttendanceStatusBadge status={row.status} />
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {row.checkInTime || '—'}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-normal">
                    {row.remarks || '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-[#FF6B2C] transition-colors">
                      View Details <ChevronRight className="w-3.5 h-3.5" />
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
