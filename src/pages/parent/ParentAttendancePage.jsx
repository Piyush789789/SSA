import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  TrendingUp,
  UserCheck,
  UserX,
  BookOpen,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const ParentAttendancePage = () => {
  const { currentUser, selectedChild, switchChild } = useAuth();

  const linkedChildren = currentUser?.linkedChildren || [];
  const currentChild = selectedChild || linkedChildren[0] || {
    name: 'Yash Verma',
    className: '8-A',
    rollNumber: 24,
    studentId: 'STU-2026-0824',
    attendanceStats: { rate: 92, present: 110, absent: 10, totalDays: 120 },
  };

  const [dateRangeMode, setDateRangeMode] = useState('LAST_30'); // 'LAST_30' | 'PREV_30' | 'THIS_MONTH'
  const [selectedCell, setSelectedCell] = useState(null);

  // Subject definitions based on child class
  const subjectsList = useMemo(() => {
    if (currentChild.className === '8-A') {
      return [
        { id: 'hindi', name: 'Hindi', teacher: 'Farhat Jahan', time: '08:00 AM - 08:45 AM' },
        { id: 'math', name: 'Mathematics', teacher: 'Shahid Ali', time: '08:45 AM - 09:30 AM' },
        { id: 'science', name: 'Science', teacher: 'Javed Akhtar', time: '09:45 AM - 10:30 AM' },
        { id: 'computer', name: 'Computer Science', teacher: 'Priya Verma', time: '10:30 AM - 11:15 AM' },
        { id: 'social', name: 'Social Studies', teacher: 'Rajesh Kumar', time: '11:15 AM - 12:00 PM' },
        { id: 'english', name: 'English', teacher: 'Neelam Gupta', time: '12:45 PM - 01:30 PM' },
      ];
    }
    // Class 5-B (Ananya)
    return [
      { id: 'math', name: 'Mathematics', teacher: 'Anjali Singh', time: '08:00 AM - 08:45 AM' },
      { id: 'hindi', name: 'Hindi', teacher: 'Farhat Jahan', time: '08:45 AM - 09:30 AM' },
      { id: 'science', name: 'Science', teacher: 'Vikram Mehta', time: '09:45 AM - 10:30 AM' },
      { id: 'english', name: 'English', teacher: 'Priya Sharma', time: '10:30 AM - 11:15 AM' },
      { id: 'computer', name: 'Computer Science', teacher: 'Priya Verma', time: '11:15 AM - 12:00 PM' },
      { id: 'social', name: 'Social Studies', teacher: 'Rajesh Kumar', time: '12:45 PM - 01:30 PM' },
    ];
  }, [currentChild.className]);

  // Generate 30 date columns
  const dateColumns = useMemo(() => {
    const dates = [];
    const baseDate = new Date('2026-09-28');
    const count = 30;
    const startOffset = dateRangeMode === 'PREV_30' ? 30 : 0;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - (i + startOffset));
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const isSunday = d.getDay() === 0;
      dates.push({
        dateStr: iso,
        displayDate: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        dayName,
        isSunday,
        formattedFull: d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      });
    }
    return dates;
  }, [dateRangeMode]);

  // Deterministic realistic attendance matrix per child
  const attendanceMatrix = useMemo(() => {
    // Specific absences for Yash Verma (8-A) vs Ananya (5-B)
    const yashAbsences = new Set([
      '2026-09-27_math',
      '2026-09-27_hindi',
      '2026-09-15_science',
      '2026-09-08_computer',
      '2026-09-02_english',
    ]);
    const ananyaAbsences = new Set([
      '2026-09-20_math',
      '2026-09-11_science',
      '2026-09-04_hindi',
    ]);

    const targetAbsences = currentChild.className === '8-A' ? yashAbsences : ananyaAbsences;

    const matrix = {};
    subjectsList.forEach((sub) => {
      matrix[sub.id] = {};
      dateColumns.forEach((col) => {
        if (col.isSunday) {
          matrix[sub.id][col.dateStr] = 'NO_CLASS';
          return;
        }
        const key = `${col.dateStr}_${sub.id}`;
        if (targetAbsences.has(key)) {
          matrix[sub.id][col.dateStr] = 'ABSENT';
        } else if (col.dayName === 'Mon' && sub.id === 'science' && col.dateStr.endsWith('14')) {
          matrix[sub.id][col.dateStr] = 'LATE';
        } else {
          matrix[sub.id][col.dateStr] = 'PRESENT';
        }
      });
    });
    return matrix;
  }, [subjectsList, dateColumns, currentChild.className]);

  // Calculated Stats
  const stats = useMemo(() => {
    let totalClasses = 0;
    let presentCount = 0;
    let absentCount = 0;

    const subjectStats = {};
    subjectsList.forEach((s) => {
      subjectStats[s.id] = { name: s.name, total: 0, present: 0, absent: 0 };
    });

    subjectsList.forEach((sub) => {
      dateColumns.forEach((col) => {
        const st = attendanceMatrix[sub.id]?.[col.dateStr];
        if (st && st !== 'NO_CLASS') {
          totalClasses++;
          subjectStats[sub.id].total++;
          if (st === 'PRESENT' || st === 'LATE') {
            presentCount++;
            subjectStats[sub.id].present++;
          } else if (st === 'ABSENT') {
            absentCount++;
            subjectStats[sub.id].absent++;
          }
        }
      });
    });

    const overallRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 92;
    const subjectBreakdown = Object.values(subjectStats).map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 90,
    }));

    return {
      overallRate,
      present: presentCount || 110,
      absent: absentCount || 10,
      totalClasses: totalClasses || 120,
      subjectBreakdown,
    };
  }, [attendanceMatrix, dateColumns, subjectsList]);

  const handleCellClick = (subject, dateCol, status) => {
    if (status === 'NO_CLASS') return;

    let remarks = status === 'PRESENT' ? 'Present for regular subject period.' : 'Absent without prior medical notice.';
    if (status === 'LATE') remarks = 'Arrived 10 minutes late due to bus traffic delay.';

    setSelectedCell({
      childName: currentChild.name,
      className: currentChild.className,
      subjectName: subject.name,
      teacher: subject.teacher,
      time: subject.time,
      dateFormatted: dateCol.formattedFull,
      dayName: dateCol.dayName,
      status: status === 'PRESENT' ? 'Present' : status === 'ABSENT' ? 'Absent' : 'Late',
      statusCode: status,
      remarks,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Child Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-[#FF6B2C]" />
            Child Attendance Report
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            30-day subject attendance ledger for {currentChild.name} (Class {currentChild.className}).
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
          <select
            value={currentChild.studentId}
            onChange={(e) => switchChild(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer pr-3"
          >
            {linkedChildren.map((child) => (
              <option key={child.studentId} value={child.studentId}>
                {child.name} ({child.className})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Overall Attendance */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.overallRate}%</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Satisfactory record</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Present */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Present</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{stats.present}</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Classes attended</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Absent</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{stats.absent}</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Absences logged</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Total Classes */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Classes</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.totalClasses}</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Recorded periods</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Timetable Grid Style Attendance Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Daily Attendance Grid (Last 30 Days)
            </h2>
            <p className="text-xs text-slate-500">
              Click any block to view class time, instructor, and absence remarks.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-2xs" />
              <span className="text-slate-700">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500 shadow-2xs" />
              <span className="text-slate-700">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-400 shadow-2xs" />
              <span className="text-slate-700">Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-200" />
              <span className="text-slate-400">No Class / Sunday</span>
            </div>
          </div>
        </div>

        {/* Scrollable Attendance Grid with Sticky Subject Column */}
        <div className="relative overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="border-collapse text-left text-xs min-w-full">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200">
                <th className="sticky left-0 z-20 bg-slate-100 py-3.5 px-4 font-bold text-slate-700 shadow-sm min-w-[180px]">
                  Subject
                </th>
                {dateColumns.map((col) => (
                  <th
                    key={col.dateStr}
                    className={`py-3 px-2 text-center font-bold min-w-[50px] border-l border-slate-200/60 ${
                      col.isSunday ? 'bg-slate-100/60 text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    <div className="text-[11px] font-extrabold">{col.displayDate}</div>
                    <div className="text-[9px] uppercase font-semibold text-slate-400">{col.dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectsList.map((subject) => (
                <tr key={subject.id} className="hover:bg-slate-50/40 transition-colors">
                  {/* Sticky Subject Column */}
                  <td className="sticky left-0 z-10 bg-white py-3.5 px-4 font-bold text-slate-900 border-r border-slate-200/80 shadow-xs flex flex-col justify-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">{subject.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{subject.teacher}</span>
                  </td>

                  {/* Date Attendance Blocks */}
                  {dateColumns.map((col) => {
                    const status = attendanceMatrix[subject.id]?.[col.dateStr];
                    return (
                      <td
                        key={col.dateStr}
                        className={`py-2 px-2 text-center border-l border-slate-100 ${
                          col.isSunday ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        {status === 'NO_CLASS' ? (
                          <div className="w-7 h-7 mx-auto rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                            —
                          </div>
                        ) : status === 'PRESENT' ? (
                          <button
                            onClick={() => handleCellClick(subject, col, status)}
                            className="w-7 h-7 mx-auto rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs hover:scale-110 transition-all cursor-pointer"
                            title={`${subject.name} - Present on ${col.displayDate}`}
                          >
                            ✓
                          </button>
                        ) : status === 'ABSENT' ? (
                          <button
                            onClick={() => handleCellClick(subject, col, status)}
                            className="w-7 h-7 mx-auto rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs hover:scale-110 transition-all cursor-pointer animate-pulse"
                            title={`${subject.name} - Absent on ${col.displayDate}`}
                          >
                            ✕
                          </button>
                        ) : status === 'LATE' ? (
                          <button
                            onClick={() => handleCellClick(subject, col, status)}
                            className="w-7 h-7 mx-auto rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 flex items-center justify-center font-bold shadow-xs hover:scale-110 transition-all cursor-pointer"
                            title={`${subject.name} - Late on ${col.displayDate}`}
                          >
                            L
                          </button>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject-wise Attendance Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Subject-wise Attendance Breakdown</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.subjectBreakdown.map((sub) => (
            <div
              key={sub.name}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-800">{sub.name}</span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    sub.rate >= 90
                      ? 'bg-emerald-100 text-emerald-800'
                      : sub.rate >= 80
                      ? 'bg-orange-100 text-[#EA580C]'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {sub.rate}%
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    sub.rate >= 90 ? 'bg-emerald-500' : sub.rate >= 80 ? 'bg-[#FF6B2C]' : 'bg-rose-500'
                  }`}
                  style={{ width: `${sub.rate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>{sub.present} Present</span>
                <span>{sub.absent} Absent</span>
                <span>{sub.total} Classes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Cell Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white ${
                    selectedCell.statusCode === 'PRESENT'
                      ? 'bg-emerald-500'
                      : selectedCell.statusCode === 'ABSENT'
                      ? 'bg-rose-500'
                      : 'bg-amber-400 text-slate-900'
                  }`}
                >
                  {selectedCell.statusCode === 'PRESENT' ? '✓' : selectedCell.statusCode === 'ABSENT' ? '✕' : 'L'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCell.subjectName}</h3>
                  <p className="text-xs text-slate-500">{selectedCell.dayName}, {selectedCell.dateFormatted}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{selectedCell.childName} (Class {selectedCell.className})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-semibold text-slate-800">{selectedCell.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Teacher:</span>
                <span className="font-semibold text-slate-800">{selectedCell.teacher}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`font-black uppercase text-xs px-2.5 py-0.5 rounded-full ${
                    selectedCell.statusCode === 'PRESENT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedCell.statusCode === 'ABSENT'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedCell.status}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 font-bold block mb-0.5">Remarks / Note:</span>
                <p className="text-slate-700 italic text-xs">{selectedCell.remarks}</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedCell(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAttendancePage;
