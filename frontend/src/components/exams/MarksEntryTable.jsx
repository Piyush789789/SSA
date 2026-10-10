import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateGradeAndGPA } from '@/data/examsData';

export const MarksEntryTable = ({
  exams,
  classesList,
  selectedExamId,
  selectedClass,
  selectedSubject,
  onExamChange,
  onClassChange,
  onSubjectChange,
  marksData,
  onSaveMarks,
}) => {
  const [localRows, setLocalRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  useEffect(() => {
    // Filter or map student rows for selected Exam, Class, and Subject
    const filtered = marksData.filter(
      (m) =>
        m.examId === selectedExamId &&
        m.className === selectedClass &&
        m.subject === selectedSubject
    );

    setLocalRows(filtered);
    setValidationErrors({});
  }, [selectedExamId, selectedClass, selectedSubject, marksData]);

  const handleMarksInput = (studentId, value, maxMarks) => {
    const num = Number(value);
    const errs = { ...validationErrors };

    if (value !== '' && (isNaN(num) || num < 0 || num > maxMarks)) {
      errs[studentId] = `Marks cannot exceed ${maxMarks}.`;
    } else {
      delete errs[studentId];
    }
    setValidationErrors(errs);

    setLocalRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? {
              ...r,
              obtainedMarks: value === '' ? '' : num,
              isAbsent: false,
            }
          : r
      )
    );
  };

  const handleAbsentToggle = (studentId, isChecked) => {
    setLocalRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? {
              ...r,
              isAbsent: isChecked,
              obtainedMarks: isChecked ? 0 : r.obtainedMarks,
            }
          : r
      )
    );
  };

  const handleSave = (status) => {
    if (Object.keys(validationErrors).length > 0) {
      alert('Please fix marks validation errors before saving.');
      return;
    }
    const updated = localRows.map((r) => ({ ...r, status }));
    onSaveMarks(updated, status);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Examination *</label>
          <select
            value={selectedExamId}
            onChange={(e) => onExamChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.academicYear})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Class *</label>
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
          >
            {classesList.map((c) => (
              <option key={c.id} value={c.name}>
                Class {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Subject *</label>
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
          >
            {['Mathematics', 'English', 'Science', 'Hindi', 'Social Science', 'Computer Science', 'EVS'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster & Marks Entry Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Roll No</th>
              <th className="py-2.5 px-3">Student ID</th>
              <th className="py-2.5 px-3 text-center">Max Marks</th>
              <th className="py-2.5 px-3 text-center">Obtained Marks</th>
              <th className="py-2.5 px-3 text-center">Percentage</th>
              <th className="py-2.5 px-3 text-center">Grade</th>
              <th className="py-2.5 px-3 text-center">Absent</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {localRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400 font-medium">
                  No marks entry records found for this combination.
                </td>
              </tr>
            ) : (
              localRows.map((r) => {
                const max = r.maxMarks || 100;
                const obtained = r.isAbsent ? 0 : Number(r.obtainedMarks || 0);
                const percent = r.isAbsent ? 0 : Math.round((obtained / max) * 100);
                const { grade } = calculateGradeAndGPA(percent);
                const hasErr = !!validationErrors[r.studentId];

                return (
                  <tr key={r.studentId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{r.studentName}</td>
                    <td className="py-3 px-3 text-slate-600">{r.rollNumber}</td>
                    <td className="py-3 px-3 text-slate-400 font-medium">{r.studentId}</td>
                    <td className="py-3 px-3 text-center text-slate-700 font-bold">{max}</td>
                    
                    {/* Inline Marks Input */}
                    <td className="py-2 px-3 text-center">
                      <div className="relative inline-block w-24">
                        <input
                          type="number"
                          disabled={r.isAbsent}
                          value={r.isAbsent ? '' : r.obtainedMarks}
                          onChange={(e) => handleMarksInput(r.studentId, e.target.value, max)}
                          placeholder="0"
                          className={`w-full text-center px-2.5 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold transition-all ${
                            hasErr
                              ? 'border-rose-500 text-rose-600 bg-rose-50 focus:ring-2 focus:ring-rose-200'
                              : 'border-slate-200 text-slate-900 focus:border-[#FF6B2C]'
                          } ${r.isAbsent ? 'opacity-40 bg-slate-100' : ''}`}
                        />
                        {hasErr && (
                          <span className="block text-[10px] font-bold text-rose-500 mt-0.5 whitespace-nowrap">
                            {validationErrors[r.studentId]}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {r.isAbsent ? '0%' : `${percent}%`}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-extrabold text-xs ${
                        r.isAbsent
                          ? 'bg-rose-50 text-rose-700'
                          : grade.startsWith('A')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {r.isAbsent ? 'F' : grade}
                      </span>
                    </td>

                    {/* Absent Toggle Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={r.isAbsent}
                        onChange={(e) => handleAbsentToggle(r.studentId, e.target.checked)}
                        className="w-4 h-4 text-[#FF6B2C] border-slate-300 rounded focus:ring-[#FF6B2C] cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.status === 'Submitted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Save Actions Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => handleSave('Draft')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4 text-slate-400" />
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          onClick={() => handleSave('Submitted')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Submit Marks</span>
        </button>
      </div>
    </div>
  );
};
