import React from 'react';
import { Building2, ChevronRight } from 'lucide-react';
import { CLASSES_LIST } from '@/data/attendanceData';

export const ClassAttendanceTable = ({ onSelectClass, selectedClass }) => {
  // Generate sample class performance statistics
  const classStats = CLASSES_LIST.slice(0, 8).map((c, index) => {
    const total = c.totalStudents;
    const absent = (index % 3) + 1;
    const present = total - absent;
    const rate = ((present / total) * 100).toFixed(1);
    return {
      id: c.id,
      name: c.name,
      total,
      present,
      absent,
      rate,
    };
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Class-wise Attendance Comparison
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Showing top classes
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Class</th>
              <th className="py-2.5 px-3">Students</th>
              <th className="py-2.5 px-3">Present</th>
              <th className="py-2.5 px-3">Absent</th>
              <th className="py-2.5 px-3">Attendance Rate</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {classStats.map((item) => {
              const isSelected = selectedClass === item.name;
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectClass(item.name)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#FFF5F0]/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-3 font-extrabold text-slate-900">
                    Class {item.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{item.total}</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">{item.present}</td>
                  <td className="py-3 px-3 text-rose-600 font-bold">{item.absent}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          style={{ width: `${item.rate}%` }}
                          className={`h-full rounded-full ${
                            Number(item.rate) >= 90
                              ? 'bg-emerald-500'
                              : Number(item.rate) >= 75
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <span className="font-extrabold text-slate-800">{item.rate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6B2C]">
                      Filter <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
