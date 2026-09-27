import React from 'react';
import { AlertOctagon, ChevronRight, UserX, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LowAttendanceSection = ({ threshold = 75, onSelectClass }) => {
  const navigate = useNavigate();

  const lowAttendanceStudents = [
    { id: 'STU-2026-0012', name: 'Rahul Kumar', className: '7-A', rollNo: 12, rate: 68 },
    { id: 'STU-2026-0005', name: 'Aditi Sharma', className: '1-B', rollNo: 1, rate: 72 },
    { id: 'STU-2026-0013', name: 'Tanya Roy', className: '7-B', rollNo: 8, rate: 70 },
  ];

  const lowAttendanceClasses = [
    { name: '7-B', rate: 74, absentCount: 9 },
    { name: '8-A', rate: 72, absentCount: 12 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Students with Low Attendance */}
      <div className="bg-white rounded-3xl border border-rose-100 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Students with Low Attendance
              </h3>
              <p className="text-[11px] font-semibold text-rose-500">
                Below {threshold}% attendance rate
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            {lowAttendanceStudents.length} Students
          </span>
        </div>

        <div className="space-y-2.5">
          {lowAttendanceStudents.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/admin/attendance/student/${s.id}`)}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/50 border border-slate-200/80 hover:border-rose-200 flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {s.rate}%
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-rose-700 transition-colors">
                    {s.name}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400">
                    Class {s.className} • Roll No. {s.rollNo}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Classes with Low Attendance */}
      <div className="bg-white rounded-3xl border border-amber-100 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Classes with Low Attendance
              </h3>
              <p className="text-[11px] font-semibold text-amber-600">
                Below {threshold}% average rate
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            {lowAttendanceClasses.length} Classes
          </span>
        </div>

        <div className="space-y-2.5">
          {lowAttendanceClasses.map((c) => (
            <div
              key={c.name}
              onClick={() => onSelectClass(c.name)}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-200 flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {c.rate}%
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-amber-800 transition-colors">
                    Class {c.name}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400">
                    High absent count: {c.absentCount} students
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                Inspect <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
