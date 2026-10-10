import React from 'react';
import { ChevronRight, UserX, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * students = [{ student, rate }] and classes = [{ name, rate, absent }] below `threshold` in the shown period.
 * Student rates over a single day are not meaningful, so the daily view hides the student list.
 */
export const LowAttendanceSection = ({
  threshold = 75,
  periodLabel,
  students = [],
  classes = [],
  showStudents = true,
  onSelectClass,
}) => {
  const navigate = useNavigate();

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
                Below {threshold}% · {periodLabel}
              </p>
            </div>
          </div>
          {showStudents && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
              {students.length} Students
            </span>
          )}
        </div>

        {!showStudents ? (
          <p className="text-xs text-slate-400 font-medium py-4 text-center">
            Switch to the weekly or monthly view to see students with low attendance.
          </p>
        ) : students.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-4 text-center">No students below {threshold}%.</p>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {students.map(({ student, rate }) => (
              <div
                key={student.id}
                onClick={() => navigate(`/admin/attendance/student/${student.id}`)}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/50 border border-slate-200/80 hover:border-rose-200 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                    {Math.round(rate)}%
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-rose-700 transition-colors">
                      {student.name}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400">
                      Class {student.className} • Roll No. {student.rollNumber ?? '—'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))}
          </div>
        )}
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
                Below {threshold}% average · {periodLabel}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            {classes.length} Classes
          </span>
        </div>

        {classes.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-4 text-center">No classes below {threshold}%.</p>
        ) : (
          <div className="space-y-2.5">
            {classes.map((c) => (
              <div
                key={c.name}
                onClick={() => onSelectClass && onSelectClass(c.name)}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-200 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                    {Math.round(c.rate)}%
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-amber-800 transition-colors">
                      Class {c.name}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400">{c.absent} absent student-days</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/classes/${c.name}`);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                >
                  View Class <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
