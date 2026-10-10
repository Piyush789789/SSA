import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck, ChevronLeft, ChevronRight, CheckCircle2, Save, UserCheck, UserX, Clock, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { addDays, formatDate, initialsOf, todayIso } from '@/utils';

const STATUS_BADGES = {
  present: { label: 'Present', className: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
  absent: { label: 'Absent', className: 'bg-rose-50 text-rose-700 border-rose-300', dot: 'bg-rose-500' },
  late: { label: 'Late', className: 'bg-amber-50 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
  leave: { label: 'Leave', className: 'bg-blue-50 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
  holiday: { label: 'Holiday', className: 'bg-purple-50 text-purple-700 border-purple-300', dot: 'bg-purple-500' },
};

const ACTION_BUTTONS = [
  { status: 'present', label: 'Present', active: 'bg-emerald-600 text-white shadow-xs', idle: 'hover:text-emerald-700 hover:bg-emerald-50' },
  { status: 'absent', label: 'Absent', active: 'bg-rose-600 text-white shadow-xs', idle: 'hover:text-rose-700 hover:bg-rose-50' },
  { status: 'late', label: 'Late', active: 'bg-amber-500 text-white shadow-xs', idle: 'hover:text-amber-700 hover:bg-amber-50' },
  { status: 'leave', label: 'Leave', active: 'bg-blue-600 text-white shadow-xs', idle: 'hover:text-blue-700 hover:bg-blue-50' },
];

export const TeacherAttendancePage = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const assignedClasses = useMemo(() => currentUser?.assignedClasses ?? [], [currentUser]);

  // The ?class= link only picks the starting class; the picker stays free afterwards.
  const [selectedClass, setSelectedClass] = useState(() => {
    const fromUrl = searchParams.get('class');
    return fromUrl && assignedClasses.includes(fromUrl) ? fromUrl : assignedClasses[0] ?? '';
  });
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [draftAttendance, setDraftAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const today = todayIso();
  const roster = useApi(selectedClass ? `/classes/${encodeURIComponent(selectedClass)}/students` : null);
  const records = useApi(selectedClass ? withQuery('/attendance', { className: selectedClass, date: selectedDate }) : null);

  const existingMap = useMemo(() => {
    const map = {};
    (records.data ?? []).forEach((r) => {
      map[r.studentId] = r;
    });
    return map;
  }, [records.data]);

  const activeRoster = useMemo(
    () =>
      (roster.data ?? []).map((student) => ({
        ...student,
        currentStatus: draftAttendance[student.id] ?? existingMap[student.id]?.status ?? 'Not Marked',
      })),
    [roster.data, draftAttendance, existingMap],
  );

  const summaryCounts = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0, notMarked: 0 };
    activeRoster.forEach((item) => {
      if (counts[item.currentStatus] !== undefined) counts[item.currentStatus] += 1;
      else if (item.currentStatus === 'Not Marked') counts.notMarked += 1;
    });
    return counts;
  }, [activeRoster]);

  const hasChanges = Object.keys(draftAttendance).length > 0;

  const resetDraft = () => {
    setDraftAttendance({});
    setSaveError('');
  };

  const changeDate = (date) => {
    if (!date || date > today) return;
    setSelectedDate(date);
    resetDraft();
  };

  const handleStatusChange = (studentId, status) => {
    setDraftAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveAttendance = async () => {
    const entries = activeRoster
      .filter((r) => r.currentStatus !== 'Not Marked')
      .map((r) => {
        const existing = existingMap[r.id];
        const unchanged = existing && existing.status === r.currentStatus;
        return {
          studentId: r.id,
          status: r.currentStatus,
          checkInTime: unchanged ? existing.checkInTime || undefined : undefined,
          remarks: existing?.remarks || undefined,
        };
      });
    if (entries.length === 0) {
      setSaveError('Mark at least one student before saving.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await http.put('/attendance', { className: selectedClass, date: selectedDate, entries });
      setDraftAttendance({});
      await records.reload();
      triggerToast(`Attendance for Class ${selectedClass} on ${formatDate(selectedDate)} saved.`);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (assignedClasses.length === 0) {
    return <EmptyMessage text="You have no assigned classes. Ask the administrator to assign one." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                resetDraft();
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

          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
            <button
              onClick={() => changeDate(addDays(selectedDate, -1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
            </button>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => changeDate(e.target.value)}
              className="px-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => changeDate(addDays(selectedDate, 1))}
              disabled={selectedDate >= today}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800">Present</span>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">{summaryCounts.present}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-rose-50/80 border border-rose-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800">Absent</span>
            <h3 className="text-2xl font-black text-rose-900 mt-1">{summaryCounts.absent}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <UserX className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800">Late</span>
            <h3 className="text-2xl font-black text-amber-900 mt-1">{summaryCounts.late}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-800">Leave / Unmarked</span>
            <h3 className="text-2xl font-black text-blue-900 mt-1">{summaryCounts.leave + summaryCounts.notMarked}</h3>
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
            <h3 className="text-base font-bold text-slate-900">Student Roster — Class {selectedClass}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select attendance status for each student ({formatDate(selectedDate)})
            </p>
          </div>

          <button
            onClick={() => {
              const allPresent = {};
              activeRoster.forEach((st) => {
                allPresent[st.id] = 'present';
              });
              setDraftAttendance(allPresent);
            }}
            disabled={activeRoster.length === 0}
            className="text-xs font-semibold text-[#FF6B2C] hover:underline cursor-pointer disabled:opacity-40"
          >
            Mark All Present
          </button>
        </div>

        <AsyncState state={[roster, records]} loadingText="Loading roster…">
          {() =>
            activeRoster.length === 0 ? (
              <EmptyMessage text={`No students are enrolled in Class ${selectedClass}.`} />
            ) : (
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
                      const status = student.currentStatus;
                      const badge = STATUS_BADGES[status];
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-700">#{student.rollNumber ?? '—'}</td>

                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                {initialsOf(student.name)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm">{student.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{student.id}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            {badge ? (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-bold text-xs ${badge.className}`}>
                                <span className={`w-2 h-2 rounded-full ${badge.dot}`} /> {badge.label}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 font-semibold text-xs">
                                <span className="w-2 h-2 rounded-full bg-slate-400" /> Not Marked
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                              {ACTION_BUTTONS.map((btn) => (
                                <button
                                  key={btn.status}
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, btn.status)}
                                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                                    status === btn.status ? btn.active : `text-slate-600 ${btn.idle}`
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </AsyncState>

        <div className="p-5 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-medium">
            {saveError ? (
              <p className="text-rose-600 font-semibold">{saveError}</p>
            ) : (
              <p className="text-slate-500">
                {hasChanges ? 'You have unsaved changes.' : 'Remember to save your changes before leaving this page.'}
              </p>
            )}
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || !hasChanges}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 stroke-[2.2]" />
            <span>{saving ? 'Saving…' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


export default TeacherAttendancePage;
