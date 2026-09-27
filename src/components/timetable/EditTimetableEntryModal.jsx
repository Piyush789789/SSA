import React, { useState, useEffect } from 'react';
import { X, Trash2, UserCheck, AlertCircle } from 'lucide-react';
import { SUBJECTS_LIST } from '@/data/timetableData';
import { initialTeachersData } from '@/data/teacherData';

export const EditTimetableEntryModal = ({
  isOpen,
  cellData, // { day, period, entry }
  onClose,
  onSave,
  onClear,
}) => {
  const [subjectId, setSubjectId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [isSubstitute, setIsSubstitute] = useState(false);
  const [substituteTeacherName, setSubstituteTeacherName] = useState('');

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && cellData) {
      const entry = cellData.entry;
      setSubjectId(entry?.subjectId || '');
      setTeacherName(entry?.teacherName || '');
      setIsSubstitute(Boolean(entry?.substituteTeacherName));
      setSubstituteTeacherName(entry?.substituteTeacherName || '');
      setShowClearConfirm(false);
    }
  }, [isOpen, cellData]);

  if (!isOpen || !cellData) return null;

  const { day, period } = cellData;

  const handleSave = (e) => {
    e.preventDefault();

    onSave({
      classId: cellData.classId,
      day,
      periodId: period.id,
      subjectId: subjectId || null,
      teacherName: teacherName || null,
      substituteTeacherName: isSubstitute ? substituteTeacherName || null : null,
    });
  };

  const handleConfirmClear = () => {
    onClear({
      classId: cellData.classId,
      day,
      periodId: period.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Edit Entry — {day.charAt(0) + day.slice(1).toLowerCase()} · {period.label}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Time: {period.startTime} – {period.endTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Confirmation View */}
        {showClearConfirm ? (
          <div className="space-y-4 bg-rose-50/60 border border-rose-100 p-5 rounded-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-rose-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Clear this timetable entry?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove the assigned subject and teacher for {day} ({period.label}).
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-white text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Clear Entry
              </button>
            </div>
          </div>
        ) : (
          /* Normal Form */
          <form onSubmit={handleSave} className="space-y-5">
            {/* Subject Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 font-medium focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">Select subject...</option>
                {SUBJECTS_LIST.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name} ({subj.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Regular Teacher Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Teacher (optional)
              </label>
              <select
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 font-medium focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">Select teacher...</option>
                {initialTeachersData.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Substitute Teacher Toggle */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSubstitute}
                  onChange={(e) => setIsSubstitute(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6B2C] focus:ring-[#FF6B2C] cursor-pointer"
                />
                <span>Substitute teacher for this day only</span>
              </label>

              {isSubstitute && (
                <div className="space-y-1.5 pl-6 animate-fade-in">
                  <label className="block text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    Substitute Teacher
                  </label>
                  <select
                    value={substituteTeacherName}
                    onChange={(e) => setSubstituteTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs border border-amber-200 bg-amber-50/50 text-slate-900 font-medium focus:border-amber-500 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select substitute teacher...</option>
                    {initialTeachersData.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-amber-600">
                    Temporary substitute for {day} only. Regular teacher remains stored.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
