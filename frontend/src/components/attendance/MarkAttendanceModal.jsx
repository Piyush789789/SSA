import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { CLASSES_LIST, ATTENDANCE_STUDENTS } from '@/data/attendanceData';

export const MarkAttendanceModal = ({ isOpen, onClose, onSaveAttendance, hasPermission = true }) => {
  const [selectedClass, setSelectedClass] = useState('1-A');
  const [selectedDate, setSelectedDate] = useState('2026-09-28');
  const [studentStates, setStudentStates] = useState({});

  useEffect(() => {
    // Filter students belonging to selectedClass
    const classStudents = ATTENDANCE_STUDENTS.filter(
      (s) => s.className === selectedClass
    );
    const initial = {};
    classStudents.forEach((s) => {
      initial[s.id] = 'present';
    });
    setStudentStates(initial);
  }, [selectedClass]);

  if (!isOpen) return null;

  const handleStatusChange = (studentId, status) => {
    setStudentStates((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!hasPermission) {
      alert('You do not have permission to mark attendance.');
      return;
    }
    const newRecords = Object.entries(studentStates).map(([studentId, status]) => {
      const student = ATTENDANCE_STUDENTS.find((s) => s.id === studentId);
      return {
        id: `ATT-NEW-${Date.now()}-${studentId}`,
        studentId,
        classId: student?.classId || 'CLASS-1-A',
        date: selectedDate,
        status,
        checkInTime: status === 'absent' ? '—' : '08:00 AM',
        remarks: 'Marked manually',
      };
    });
    onSaveAttendance(newRecords);
    onClose();
  };

  const currentClassStudents = ATTENDANCE_STUDENTS.filter(
    (s) => s.className === selectedClass
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Mark Class Attendance</h3>
              <p className="text-xs text-slate-400">Select class and mark student status</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Top Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
            >
              {CLASSES_LIST.map((c) => (
                <option key={c.id} value={c.name}>
                  Class {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Date *</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        {/* Student Rows List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar my-2">
          {currentClassStudents.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No students found in Class {selectedClass}</p>
          ) : (
            currentClassStudents.map((s) => {
              const currentStatus = studentStates[s.id] || 'present';
              return (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{s.name}</h4>
                    <p className="text-[11px] text-slate-400">Roll No. {s.rollNumber} • {s.id}</p>
                  </div>

                  <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200">
                    {['present', 'absent', 'late'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(s.id, st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          currentStatus === st
                            ? st === 'present'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : st === 'absent'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-2xl bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer"
          >
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
};
