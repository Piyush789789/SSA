import React from 'react';
import { Plus, Clock } from 'lucide-react';
import { TIMETABLE_DAYS, SUBJECTS_LIST } from '@/data/timetableData';

export const TimetableGrid = ({
  periods,
  entries,
  classId,
  selectedSubjectId,
  onCellClick,
}) => {
  // Determine current weekday name e.g. "THURSDAY"
  const currentDayName = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase();

  // Find subject details helper
  const getSubjectDetails = (subjId) => {
    return (
      SUBJECTS_LIST.find((s) => s.id === subjId) || {
        name: subjId,
        badgeClass: 'bg-[#FFF5F0] text-[#FF6B2C] border-orange-200',
        colorBg: 'bg-white',
        colorText: 'text-slate-900',
        colorBorder: 'border-slate-200',
      }
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider">
              {/* TIME Column Header */}
              <th className="py-4 px-4 sm:px-6 w-[140px] text-slate-500 bg-slate-50/80 sticky left-0 z-10 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>TIME</span>
              </th>

              {/* DAYS Columns Headers */}
              {TIMETABLE_DAYS.map((day) => {
                const isToday = currentDayName === day;
                return (
                  <th
                    key={day}
                    className={`py-4 px-4 text-center font-extrabold transition-colors ${
                      isToday
                        ? 'bg-[#FFF5F0] text-[#FF6B2C] border-b-2 border-b-[#FF6B2C]'
                        : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {periods.map((period) => {
              const isBreakRow = period.type === 'break';

              return (
                <tr
                  key={period.id}
                  className={`transition-colors ${
                    isBreakRow ? 'bg-orange-50/30' : 'hover:bg-slate-50/40'
                  }`}
                >
                  {/* Sticky Time Column Cell */}
                  <td className="py-4 px-4 sm:px-6 sticky left-0 z-10 bg-white/95 backdrop-blur-xs border-r border-slate-100 whitespace-nowrap">
                    <div className="font-extrabold text-slate-900 leading-snug">
                      {period.label}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {period.startTime} – {period.endTime}
                    </div>
                  </td>

                  {/* If Break Row -> Full row styled break text across all days */}
                  {isBreakRow ? (
                    <td
                      colSpan={TIMETABLE_DAYS.length}
                      className="py-4 px-4 text-center italic font-semibold text-slate-400 select-none bg-orange-50/40"
                    >
                      <span className="inline-block tracking-widest text-[11px] uppercase">
                        {period.label} ({period.startTime} – {period.endTime})
                      </span>
                    </td>
                  ) : (
                    /* Day Cells */
                    TIMETABLE_DAYS.map((day) => {
                      // Find matching entry for this class, day, and period
                      const entry = entries.find(
                        (e) =>
                          e.classId === classId &&
                          e.day === day &&
                          e.periodId === period.id
                      );

                      const hasSubject = Boolean(entry && entry.subjectId);
                      const subjDetails = hasSubject
                        ? getSubjectDetails(entry.subjectId)
                        : null;

                      const isHighlighted =
                        selectedSubjectId &&
                        hasSubject &&
                        entry.subjectId === selectedSubjectId;

                      const isDimmed =
                        selectedSubjectId &&
                        (!hasSubject || entry.subjectId !== selectedSubjectId);

                      const isSubstitute = Boolean(entry?.substituteTeacherName);
                      const teacherDisplay = isSubstitute
                        ? entry.substituteTeacherName
                        : entry?.teacherName;

                      return (
                        <td
                          key={day}
                          onClick={() => onCellClick(day, period, entry)}
                          className={`py-2 px-2.5 vertical-top text-center transition-all cursor-pointer ${
                            isDimmed ? 'opacity-30' : ''
                          }`}
                        >
                          {hasSubject ? (
                            <div
                              className={`p-3 rounded-2xl border text-center transition-all duration-200 shadow-2xs group relative ${
                                subjDetails.colorBg
                              } ${subjDetails.colorBorder} ${
                                isHighlighted
                                  ? 'ring-2 ring-[#FF6B2C] ring-offset-1 shadow-md scale-102'
                                  : 'hover:shadow-sm hover:border-slate-300'
                              }`}
                            >
                              {/* Subject Name */}
                              <div
                                className={`font-extrabold text-xs leading-tight truncate ${subjDetails.colorText}`}
                                title={subjDetails.name}
                              >
                                {subjDetails.name}
                              </div>

                              {/* Teacher Name */}
                              {teacherDisplay && (
                                <div className="text-[11px] text-slate-500 font-medium truncate mt-1">
                                  {teacherDisplay}
                                </div>
                              )}

                              {/* Substitute Badge */}
                              {isSubstitute && (
                                <div className="mt-1.5">
                                  <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    Substitute
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Empty Cell Placeholder */
                            <div className="p-3 rounded-2xl border border-dashed border-slate-200/80 hover:border-orange-300 hover:bg-orange-50/30 text-slate-400 hover:text-[#FF6B2C] flex items-center justify-center gap-1.5 transition-all group">
                              <Plus className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                              <span className="text-[11px] font-semibold">
                                Add Subject
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
