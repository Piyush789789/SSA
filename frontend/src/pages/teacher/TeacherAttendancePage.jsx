import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck, ChevronLeft, ChevronRight, CheckCircle2, Save, UserCheck, UserX, Clock, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const TeacherAttendancePage = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { students, attendanceRecords, saveAttendanceRecords } = useData();

  const assignedClasses = currentUser?.assignedClasses || ['5-B', '6-A'];
  const initialClass = searchParams.get('class') && assignedClasses.includes(searchParams.get('class'))
    ? searchParams.get('class')
    : (assignedClasses[0] || '5-B');

  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedDate, setSelectedDate] = useState('2026-09-28');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const classFromUrl = searchParams.get('class');
    if (classFromUrl && assignedClasses.includes(classFromUrl)) {
      setSelectedClass(classFromUrl);
    }
  }, [searchParams, assignedClasses]);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.className === selectedClass);
  }, [students, selectedClass]);

  // Map attendance status for selected class and date
  const [draftAttendance, setDraftAttendance] = useState({});

  // Synchronize draft state when class or date changes
  const activeRoster = useMemo(() => {
    const existingMap = {};
    attendanceRecords.forEach((r) => {
      if (r.date === selectedDate) {
        existingMap[r.studentId] = r.status;
      }
    });

    return classStudents.map((student) => {
      const studentId = student.studentId || student.id;
      // Prefer local draft state if present, else existing record, else 'Not Marked'
      const status = draftAttendance[studentId] !== undefined
        ? draftAttendance[studentId]
        : existingMap[studentId] || 'Not Marked';

      return {
        ...student,
        currentStatus: status,
      };
    });
  }, [classStudents, attendanceRecords, selectedDate, draftAttendance]);

  // Counts for summary cards
  const summaryCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let notMarked = 0;

    activeRoster.forEach((item) => {
      if (item.currentStatus === 'present') present++;
      else if (item.currentStatus === 'absent') absent++;
      else if (item.currentStatus === 'late') late++;
      else if (item.currentStatus === 'leave') leave++;
      else notMarked++;
    });

    return { present, absent, late, leave, notMarked };
  }, [activeRoster]);

  const handleStatusChange = (studentId, status) => {
    setDraftAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleDateChange = (daysDelta) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + daysDelta);
    const newDateStr = dt.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
    setDraftAttendance({});
  };

  const handleSaveAttendance = () => {
    const newRecords = activeRoster
      .filter((r) => r.currentStatus !== 'Not Marked')
      .map((r) => ({
        id: `ATT-${selectedDate}-${r.studentId || r.id}`,
        studentId: r.studentId || r.id,
        className: r.className,
        date: selectedDate,
        status: r.currentStatus,
        checkInTime: r.currentStatus === 'present' ? '08:00 AM' : r.currentStatus === 'late' ? '08:25 AM' : '—',
        remarks: '',
      }));

    saveAttendanceRecords(newRecords);
    triggerToast(`Attendance for Class ${selectedClass} saved successfully.`);
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <CalendarCheck className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>Attendance</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Mark daily student attendance for your assigned classes
          </p>
        </div>

        {/* Action Controls: Class Dropdown & Date Picker */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Select Dropdown (Teacher Assigned Classes ONLY) */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setDraftAttendance({});
              }}
              className="h-10 px-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 shadow-xs cursor-pointer"
            >
              {assignedClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker with Prev/Next buttons */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDraftAttendance({});
              }}
              className="px-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => handleDateChange(1)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Present Summary */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800">Present</span>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">{summaryCounts.present}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Absent Summary */}
        <div className="bg-rose-50/80 border border-rose-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800">Absent</span>
            <h3 className="text-2xl font-black text-rose-900 mt-1">{summaryCounts.absent}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <UserX className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Late Summary */}
        <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800">Late</span>
            <h3 className="text-2xl font-black text-amber-900 mt-1">{summaryCounts.late}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Leave / Not Marked Summary */}
        <div className="bg-blue-50/80 border border-blue-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-800">Leave / Unmarked</span>
            <h3 className="text-2xl font-black text-blue-900 mt-1">
              {summaryCounts.leave + summaryCounts.notMarked}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <CalendarDays className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Student Attendance Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Student Roster — Class {selectedClass}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select attendance status for each student ({selectedDate})
            </p>
          </div>

          <button
            onClick={() => {
              // Quick mark all present
              const allP = {};
              activeRoster.forEach((st) => {
                allP[st.studentId || st.id] = 'present';
              });
              setDraftAttendance(allP);
            }}
            className="text-xs font-semibold text-[#FF6B2C] hover:underline cursor-pointer"
          >
            Mark All Present
          </button>
        </div>

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Roll No</th>
                <th className="py-3.5 px-6">Student Name</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeRoster.map((student) => {
                const sId = student.studentId || student.id;
                const status = student.currentStatus;

                return (
                  <tr key={sId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-700">
                      #{student.rollNumber || student.rollNo || 1}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                          {student.initials || student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{student.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{student.email || sId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      {status === 'present' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
                        </span>
                      )}
                      {status === 'absent' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
                        </span>
                      )}
                      {status === 'late' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-300 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Late
                        </span>
                      )}
                      {status === 'leave' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-300 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> Leave
                        </span>
                      )}
                      {status === 'Not Marked' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 font-semibold text-xs">
                          <span className="w-2 h-2 rounded-full bg-slate-400" /> Not Marked
                        </span>
                      )}
                    </td>

                    {/* Attendance Control Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                        {/* Present Button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(sId, 'present')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          Present
                        </button>

                        {/* Absent Button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(sId, 'absent')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          Absent
                        </button>

                        {/* Late Button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(sId, 'late')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                            status === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          Late
                        </button>

                        {/* Leave Button */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(sId, 'leave')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                            status === 'leave'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Save Attendance Button Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Remember to save your changes before leaving this page.
          </p>

          <button
            onClick={handleSaveAttendance}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <Save className="w-4 h-4 stroke-[2.2]" />
            <span>Save Attendance</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendancePage;
