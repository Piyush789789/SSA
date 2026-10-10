import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, FileCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { calculateGradeAndGPA } from '@/data/examsData';

export const TeacherMarksEntryPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { students, exams, schedules, marksRecords, saveMarksRecords } = useData();

  // Find schedule record or default schedule
  const currentSchedule = useMemo(() => {
    return schedules.find((s) => s.id === examId) || schedules[0];
  }, [schedules, examId]);

  const parentExam = useMemo(() => {
    return exams.find((e) => e.id === currentSchedule?.examId) || exams[0];
  }, [exams, currentSchedule]);

  const targetClass = currentSchedule?.className || '5-B';
  const targetSubject = currentSchedule?.subject || 'Mathematics';
  const maxMarks = currentSchedule?.maxMarks || 50;

  // Filter class students
  const classStudents = useMemo(() => {
    return students.filter((s) => s.className === targetClass);
  }, [students, targetClass]);

  // Initial Marks Roster State
  const [marksState, setMarksState] = useState(() => {
    const map = {};
    marksRecords.forEach((r) => {
      if (r.className === targetClass && r.subject === targetSubject) {
        map[r.studentId] = {
          obtainedMarks: r.isAbsent ? '' : r.obtainedMarks,
          isAbsent: r.isAbsent || false,
          status: r.status || 'Draft',
        };
      }
    });

    // Populate for all class students
    const initialState = {};
    classStudents.forEach((student) => {
      const sId = student.studentId || student.id;
      if (map[sId]) {
        initialState[sId] = map[sId];
      } else {
        initialState[sId] = {
          obtainedMarks: '',
          isAbsent: false,
          status: 'Not Entered',
        };
      }
    });

    return initialState;
  });

  const [toastMessage, setToastMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Handle Input Changes
  const handleMarksChange = (studentId, val) => {
    // Clear validation error for student
    setValidationErrors((prev) => ({ ...prev, [studentId]: null }));

    if (val === '') {
      setMarksState((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], obtainedMarks: '', isAbsent: false },
      }));
      return;
    }

    const num = Number(val);
    if (isNaN(num)) return;

    if (num < 0) {
      setValidationErrors((prev) => ({ ...prev, [studentId]: 'Marks cannot be less than 0' }));
    } else if (num > maxMarks) {
      setValidationErrors((prev) => ({
        ...prev,
        [studentId]: `Marks cannot exceed maximum marks (${maxMarks})`,
      }));
    }

    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        obtainedMarks: val,
        isAbsent: false,
      },
    }));
  };

  const handleAbsentToggle = (studentId, isAbsent) => {
    setValidationErrors((prev) => ({ ...prev, [studentId]: null }));
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent,
        obtainedMarks: isAbsent ? '' : prev[studentId]?.obtainedMarks || '',
      },
    }));
  };

  const validateAll = () => {
    const errors = {};
    let hasError = false;

    Object.keys(marksState).forEach((sId) => {
      const rec = marksState[sId];
      if (!rec.isAbsent && rec.obtainedMarks !== '') {
        const num = Number(rec.obtainedMarks);
        if (num < 0 || num > maxMarks) {
          errors[sId] = `Marks must be between 0 and ${maxMarks}`;
          hasError = true;
        }
      }
    });

    setValidationErrors(errors);
    return !hasError;
  };

  const handleSave = (submitStatus = 'Draft') => {
    if (!validateAll()) {
      alert('Please fix validation errors before saving.');
      return;
    }

    const newRecords = classStudents.map((student) => {
      const sId = student.studentId || student.id;
      const rec = marksState[sId] || { obtainedMarks: '', isAbsent: false };
      const val = rec.obtainedMarks !== '' ? Number(rec.obtainedMarks) : 0;

      return {
        id: `m-${currentSchedule.id}-${sId}`,
        examId: currentSchedule.examId,
        scheduleId: currentSchedule.id,
        className: targetClass,
        subject: targetSubject,
        studentId: sId,
        studentName: student.name,
        rollNumber: student.rollNumber || student.rollNo || 1,
        maxMarks,
        obtainedMarks: rec.isAbsent ? 0 : val,
        isAbsent: rec.isAbsent,
        status: submitStatus,
        teacher: currentUser?.name || 'Anjali Singh',
      };
    });

    saveMarksRecords(newRecords);
    triggerToast(
      submitStatus === 'Submitted'
        ? `Marks submitted successfully for Class ${targetClass} ${targetSubject}.`
        : `Draft marks saved for Class ${targetClass} ${targetSubject}.`
    );
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate('/teacher/exams')}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
            title="Back to Exams"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 stroke-[2]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-orange-100 text-[#FF6B2C] font-bold rounded-md text-xs">
                Class {targetClass}
              </span>
              <span className="text-xs font-semibold text-slate-500">{targetSubject}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Marks Entry — {parentExam.name}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('Draft')}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs shadow-xs transition-all cursor-pointer"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave('Submitted')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs"
          >
            <FileCheck className="w-4 h-4 stroke-[2]" />
            <span>Submit Marks</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-semibold block">Subject:</span>
          <span className="font-extrabold text-slate-900 text-sm">{targetSubject}</span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold block">Class:</span>
          <span className="font-extrabold text-slate-900 text-sm">Class {targetClass}</span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold block">Maximum Marks:</span>
          <span className="font-extrabold text-[#FF6B2C] text-sm">{maxMarks} Marks</span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold block">Exam Date:</span>
          <span className="font-extrabold text-slate-900 text-sm">{currentSchedule?.date || '2026-09-29'}</span>
        </div>
      </div>

      {/* Student Marks Entry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Roll No</th>
                <th className="py-3.5 px-6">Student Name</th>
                <th className="py-3.5 px-6">Student ID</th>
                <th className="py-3.5 px-6">Marks Obtained (Out of {maxMarks})</th>
                <th className="py-3.5 px-6">Absent</th>
                <th className="py-3.5 px-6">Calculated Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents.map((student) => {
                const sId = student.studentId || student.id;
                const rec = marksState[sId] || { obtainedMarks: '', isAbsent: false };
                const error = validationErrors[sId];

                // Auto Grade calculation
                let gradeObj = null;
                if (!rec.isAbsent && rec.obtainedMarks !== '') {
                  const pct = (Number(rec.obtainedMarks) / maxMarks) * 100;
                  gradeObj = calculateGradeAndGPA(pct);
                }

                return (
                  <tr key={sId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-700">
                      #{student.rollNumber || student.rollNo || 1}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                          {student.initials || student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{student.name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-400">{sId}</td>

                    {/* Marks Input Field */}
                    <td className="py-4 px-6">
                      <div className="relative max-w-[140px]">
                        <input
                          type="number"
                          min="0"
                          max={maxMarks}
                          disabled={rec.isAbsent}
                          value={rec.obtainedMarks}
                          onChange={(e) => handleMarksChange(sId, e.target.value)}
                          placeholder="Enter marks"
                          className={`w-full h-10 px-3 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 focus:outline-none ${
                            error
                              ? 'border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                              : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20'
                          } ${rec.isAbsent ? 'opacity-40 bg-slate-100 cursor-not-allowed' : ''}`}
                        />
                        {error && (
                          <p className="text-[10px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{error}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Absent Toggle Checkbox */}
                    <td className="py-4 px-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rec.isAbsent}
                          onChange={(e) => handleAbsentToggle(sId, e.target.checked)}
                          className="w-4 h-4 rounded text-[#FF6B2C] focus:ring-[#FF6B2C] cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-700">Mark Absent</span>
                      </label>
                    </td>

                    {/* Calculated Grade */}
                    <td className="py-4 px-6">
                      {rec.isAbsent ? (
                        <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs">
                          ABSENT
                        </span>
                      ) : gradeObj ? (
                        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs">
                          Grade {gradeObj.grade} ({gradeObj.label})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not Entered</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Double check all entries before submitting final marks.
          </p>
          <button
            onClick={() => handleSave('Submitted')}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs"
          >
            <FileCheck className="w-4 h-4 stroke-[2]" />
            <span>Submit Marks</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherMarksEntryPage;
