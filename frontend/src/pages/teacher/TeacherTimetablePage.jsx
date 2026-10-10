import React, { useState, useMemo } from 'react';
import { Calendar, Clock, BookOpen, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { INITIAL_PERIODS, SUBJECTS_LIST, TIMETABLE_DAYS, INITIAL_TIMETABLE_ENTRIES } from '@/data/timetableData';

export const TeacherTimetablePage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Week'); // 'Week' | 'Day'
  const [selectedDay, setSelectedDay] = useState('MONDAY');

  const teacherName = currentUser?.name || 'Anjali Singh';

  // Filter entries taught by Anjali Singh
  const teacherEntries = useMemo(() => {
    return INITIAL_TIMETABLE_ENTRIES.filter(
      (entry) => entry.teacherName === teacherName || entry.substituteTeacherName === teacherName
    );
  }, [teacherName]);

  const periodsList = INITIAL_PERIODS.filter((p) => p.type === 'period');

  const getSubjectDetails = (subjectId) => {
    return SUBJECTS_LIST.find((s) => s.id === subjectId) || { name: subjectId, code: subjectId.toUpperCase(), colorBg: 'bg-orange-50', colorText: 'text-orange-900', badgeClass: 'bg-orange-100 text-orange-800' };
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>My Schedule & Timetable</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Weekly teaching schedule for {teacherName} across assigned classes
          </p>
        </div>

        {/* Week / Day View Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('Week')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'Week'
                ? 'bg-white text-[#FF6B2C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab('Day')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'Day'
                ? 'bg-white text-[#FF6B2C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily View
          </button>
        </div>
      </div>

      {/* Day Selector (if Day view selected) */}
      {activeTab === 'Day' && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80">
          {TIMETABLE_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDay === day
                  ? 'bg-[#FF6B2C] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* WEEKLY GRID VIEW */}
      {activeTab === 'Week' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-28">Time / Day</th>
                  {TIMETABLE_DAYS.map((day) => (
                    <th key={day} className="py-3.5 px-4 min-w-[150px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodsList.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Time slot column */}
                    <td className="py-4 px-4 bg-slate-50/60 font-bold text-slate-700 text-[11px]">
                      <p>{period.label}</p>
                      <p className="text-slate-400 font-medium text-[10px] mt-0.5">
                        {period.startTime} - {period.endTime}
                      </p>
                    </td>

                    {/* Day Columns */}
                    {TIMETABLE_DAYS.map((day) => {
                      const entry = teacherEntries.find(
                        (e) => e.day === day && e.periodId === period.id
                      );

                      if (!entry) {
                        return (
                          <td key={day} className="py-3 px-3">
                            <div className="h-14 rounded-xl border border-dashed border-slate-200/80 flex items-center justify-center text-[11px] text-slate-300 font-medium">
                              Free
                            </div>
                          </td>
                        );
                      }

                      const subj = getSubjectDetails(entry.subjectId);
                      const isSubstitute = entry.substituteTeacherName === teacherName;

                      return (
                        <td key={day} className="py-3 px-3">
                          <div
                            className={`p-3 rounded-xl border shadow-xs flex flex-col justify-between h-full space-y-1 ${subj.colorBg} ${subj.colorBorder}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 text-xs">
                                Class {entry.classId}
                              </span>
                              {isSubstitute && (
                                <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[9px] font-black">
                                  Substitute
                                </span>
                              )}
                            </div>

                            <p className={`font-bold text-xs ${subj.colorText}`}>
                              {subj.name}
                            </p>

                            <p className="text-[10px] text-slate-500 font-semibold">
                              {entry.room || 'Room 101'}
                            </p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DAILY VIEW CARDS */
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Teaching Schedule for {selectedDay}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periodsList.map((period) => {
              const entry = teacherEntries.find(
                (e) => e.day === selectedDay && e.periodId === period.id
              );

              if (!entry) {
                return (
                  <div
                    key={period.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200/60 flex items-center justify-between text-slate-400 opacity-60"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-500">{period.label}</span>
                      <p className="text-[11px] mt-0.5">{period.startTime} - {period.endTime}</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-xl">Free Period</span>
                  </div>
                );
              }

              const subj = getSubjectDetails(entry.subjectId);
              const isSubstitute = entry.substituteTeacherName === teacherName;

              return (
                <div
                  key={period.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-orange-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-orange-100 text-[#FF6B2C] font-extrabold rounded-xl text-xs">
                      Class {entry.classId}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {period.startTime} - {period.endTime}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{subj.name}</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {entry.room || 'Room 101'}
                    </p>
                  </div>

                  {isSubstitute && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                      <span>Assigned as Substitute Teacher</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetablePage;
