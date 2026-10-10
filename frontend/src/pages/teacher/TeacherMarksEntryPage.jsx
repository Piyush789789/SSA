import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, FileCheck } from 'lucide-react';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage, ErrorMessage, LoadingMessage } from '@/components/common/AsyncState';
import { formatDate, initialsOf, todayIso } from '@/utils';

/** Grade band for a percentage, using the scale from GET /meta (sorted high to low). */
const gradeFor = (percentage, bands) => {
  const sorted = [...(bands ?? [])].sort((a, b) => b.min - a.min);
  return sorted.find((band) => percentage >= band.min) ?? null;
};

const STATUS_STYLES = {
  Submitted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Draft: 'bg-amber-50 text-amber-700 border-amber-200',
  'Not Entered': 'bg-slate-100 text-slate-500 border-slate-200',
};

export const TeacherMarksEntryPage = () => {
  // The route param is the exam paper (ExamSchedule) id: /teacher/exams/:examId/marks
  const { examId: scheduleId } = useParams();
  const navigate = useNavigate();

  const sheet = useApi(scheduleId ? `/exam-schedules/${encodeURIComponent(scheduleId)}/marks` : null);
  const meta = useApi('/meta');
  const parentExamId = sheet.data?.schedule?.examId;
  const exam = useApi(parentExamId ? `/exams/${encodeURIComponent(parentExamId)}` : null);

  // Unsaved edits per student: { obtainedMarks: string, absent: boolean }
  const [edits, setEdits] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const schedule = sheet.data?.schedule;
  const maxMarks = schedule?.maxMarks ?? 0;
  const today = todayIso();
  const notYetHeld = schedule ? schedule.date > today : false;
  const published = exam.data?.resultsStatus === 'Published';

  const rows = useMemo(
    () =>
      (sheet.data?.rows ?? []).map((row) => {
        const edit = edits[row.studentId];
        return {
          ...row,
          value: edit ? edit.obtainedMarks : row.obtainedMarks == null ? '' : String(row.obtainedMarks),
          isAbsent: edit ? edit.absent : row.absent,
          changed: Boolean(edit),
        };
      }),
    [sheet.data, edits],
  );

  const hasChanges = Object.keys(edits).length > 0;

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const validateValue = (val) => {
    if (val === '') return null;
    const num = Number(val);
    if (Number.isNaN(num)) return 'Enter a number';
    if (num < 0) return 'Marks cannot be less than 0';
    if (num > maxMarks) return `Marks cannot exceed maximum marks (${maxMarks})`;
    return null;
  };

  const handleMarksChange = (row, val) => {
    setEdits((prev) => ({ ...prev, [row.studentId]: { obtainedMarks: val, absent: false } }));
    setValidationErrors((prev) => ({ ...prev, [row.studentId]: validateValue(val) }));
  };

  const handleAbsentToggle = (row, absent) => {
    setEdits((prev) => ({
      ...prev,
      [row.studentId]: { obtainedMarks: absent ? '' : row.value, absent },
    }));
    setValidationErrors((prev) => ({ ...prev, [row.studentId]: absent ? null : validateValue(row.value) }));
  };

  const handleSave = async (submit) => {
    const errors = {};
    rows.forEach((row) => {
      if (!row.isAbsent) {
        const error = validateValue(row.value);
        if (error) errors[row.studentId] = error;
      }
    });
    setValidationErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setSaveError('Please fix the highlighted marks before saving.');
      return;
    }

    // Blank (not absent) rows are sent as null and the server skips them; they are never stored as zero.
    // A row that had saved marks and was emptied is sent with clear: true, which deletes the saved mark.
    const entries = rows.map((row) => {
      const blank = !row.isAbsent && row.value === '';
      return {
        studentId: row.studentId,
        obtainedMarks: row.isAbsent || blank ? null : Number(row.value),
        absent: row.isAbsent,
        clear: blank && row.status !== 'Not Entered',
      };
    });

    setSaving(true);
    setSaveError('');
    try {
      const updated = await http.put(`/exam-schedules/${encodeURIComponent(scheduleId)}/marks`, { submit, entries });
      sheet.setData(updated);
      setEdits({});
      triggerToast(
        submit
          ? `Marks submitted for Class ${schedule.className} ${schedule.subject}.`
          : `Draft marks saved for Class ${schedule.className} ${schedule.subject}.`,
      );
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const backButton = (
    <button
      onClick={() => navigate('/teacher/exams')}
      className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
      title="Back to Exams"
    >
      <ArrowLeft className="w-5 h-5 text-slate-700 stroke-[2]" />
    </button>
  );

  if (sheet.error && sheet.data == null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3.5">
          {backButton}
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Marks Entry</h1>
        </div>
        {sheet.error.status === 404 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-500 text-sm">
            Paper not found. It may have been removed — go back to Tests & Examinations and pick a paper.
          </div>
        ) : (
          <ErrorMessage error={sheet.error} onRetry={sheet.reload} />
        )}
      </div>
    );
  }

  if (sheet.loading) return <LoadingMessage text="Loading marks sheet…" />;

  const bands = meta.data?.gradeBands;

  return (
    <div className="space-y-6 sm:space-y-8">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {backButton}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-orange-100 text-[#FF6B2C] font-bold rounded-md text-xs">
                Class {schedule.className}
              </span>
              <span className="text-xs font-semibold text-slate-500">{schedule.subject}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Marks Entry — {sheet.data.examName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span className="font-extrabold text-slate-900 text-sm">{schedule.subject}</span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold block">Class:</span>
          <span className="font-extrabold text-slate-900 text-sm">Class {schedule.className}</span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold block">Maximum Marks:</span>
          <span className="font-extrabold text-[#FF6B2C] text-sm">
            {maxMarks} Marks <span className="text-slate-400 font-semibold">(pass {schedule.passingMarks})</span>
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold block">Exam Date:</span>
          <span className="font-extrabold text-slate-900 text-sm">{formatDate(schedule.date)}</span>
        </div>
      </div>

      {notYetHeld && (
        <div className="flex items-center gap-2 p-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          This paper is on {formatDate(schedule.date)}. Marks can be entered from that day.
        </div>
      )}
      {published && (
        <div className="flex items-center gap-2 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Results for this exam are published, so marks can no longer be changed. Ask the administrator to unpublish them
          if a correction is needed.
        </div>
      )}
      {saveError && <ErrorMessage error={{ message: saveError }} />}

      {/* Student Marks Entry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AsyncState state={meta}>
          {() =>
            rows.length === 0 ? (
              <EmptyMessage text={`No students are enrolled in Class ${schedule.className}.`} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-6">Roll No</th>
                      <th className="py-3.5 px-6">Student Name</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Marks Obtained (Out of {maxMarks})</th>
                      <th className="py-3.5 px-6">Absent</th>
                      <th className="py-3.5 px-6">Calculated Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const error = validationErrors[row.studentId];
                      const band =
                        !row.isAbsent && row.value !== '' && !error && maxMarks > 0
                          ? gradeFor((Number(row.value) / maxMarks) * 100, bands)
                          : null;

                      return (
                        <tr key={row.studentId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-700">#{row.rollNumber}</td>

                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                {initialsOf(row.studentName)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 text-xs sm:text-sm block">{row.studentName}</span>
                                <span className="text-[11px] text-slate-400 font-medium">{row.studentId}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg border font-bold text-[11px] ${
                                STATUS_STYLES[row.status] ?? STATUS_STYLES['Not Entered']
                              }`}
                            >
                              {row.changed ? 'Unsaved' : row.status}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <div className="relative max-w-[140px]">
                              <input
                                type="number"
                                min="0"
                                max={maxMarks}
                                step="0.5"
                                disabled={row.isAbsent}
                                value={row.value}
                                onChange={(e) => handleMarksChange(row, e.target.value)}
                                placeholder="Enter marks"
                                className={`w-full h-10 px-3 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 focus:outline-none ${
                                  error
                                    ? 'border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                                    : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20'
                                } ${row.isAbsent ? 'opacity-40 bg-slate-100 cursor-not-allowed' : ''}`}
                              />
                              {error && (
                                <p className="text-[10px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>{error}</span>
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.isAbsent}
                                onChange={(e) => handleAbsentToggle(row, e.target.checked)}
                                className="w-4 h-4 rounded text-[#FF6B2C] focus:ring-[#FF6B2C] cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-slate-700">Mark Absent</span>
                            </label>
                          </td>

                          <td className="py-4 px-6">
                            {row.isAbsent ? (
                              <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs">
                                ABSENT
                              </span>
                            ) : band ? (
                              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs">
                                Grade {band.grade} ({band.label})
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
            )
          }
        </AsyncState>

        <div className="p-5 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            {hasChanges
              ? 'You have unsaved changes. Blank marks are left blank (not saved as zero).'
              : 'Double check all entries before submitting final marks. Blank marks are left blank.'}
          </p>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileCheck className="w-4 h-4 stroke-[2]" />
            <span>{saving ? 'Saving…' : 'Submit Marks'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherMarksEntryPage;
