import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate } from '@/utils';
import { gradeFor } from './grading';
import { useI18n } from '@/i18n/translate';
import { QuestionsEditor } from './QuestionsEditor';
import { QuestionMarksGrid } from './QuestionMarksGrid';
import { MarksImportPanel } from './MarksImportPanel';
import { buildQuestionEntry, cellsFromSaved, rowHasCellErrors } from './questionMarks';

const NONE = [];

/**
 * Marks entry for one paper: pick exam → class → paper, then edit the sheet from
 * GET /exam-schedules/{id}/marks (every student of the class) and save with PUT.
 */
export const MarksEntryTable = ({ exams, selectedExamId, onExamChange, gradeBands = NONE, onSaved }) => {
  const { t, tx } = useI18n();
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const examClasses = currentExam?.classes || NONE;

  const [chosenClass, setChosenClass] = useState('');
  const className = examClasses.includes(chosenClass) ? chosenClass : examClasses[0] || '';

  const papers = useApi(
    currentExam && className ? withQuery('/exam-schedules', { examId: currentExam.id, className }) : null,
  );
  const paperList = papers.data || NONE;

  const [chosenPaperId, setChosenPaperId] = useState('');
  const paper = paperList.find((p) => p.id === chosenPaperId) || paperList[0] || null;

  const sheetPath = paper ? `/exam-schedules/${paper.id}/marks` : null;
  const sheet = useApi(sheetPath);
  const questions = sheet.data?.schedule?.questions ?? NONE;
  const hasQuestions = questions.length > 0;

  const [localRows, setLocalRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setLocalRows(
      (sheet.data?.rows || []).map((r) => ({
        ...r,
        obtainedMarks: r.obtainedMarks == null ? '' : r.obtainedMarks,
        cells: cellsFromSaved(r.questionMarks, sheet.data?.schedule?.questions ?? NONE),
        saved: r,
        changed: false,
      })),
    );
    setValidationErrors({});
    setSaveError('');
  }, [sheet.data]);

  const maxMarks = sheet.data?.schedule?.maxMarks ?? paper?.maxMarks ?? 0;

  const handleMarksInput = (studentId, value) => {
    const num = Number(value);
    const errs = { ...validationErrors };
    if (value !== '' && (Number.isNaN(num) || num < 0 || num > maxMarks)) {
      errs[studentId] = `Marks must be 0–${maxMarks}.`;
    } else {
      delete errs[studentId];
    }
    setValidationErrors(errs);
    setLocalRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, obtainedMarks: value === '' ? '' : num, absent: false } : r)),
    );
  };

  const handleAbsentToggle = (studentId, isChecked) => {
    if (isChecked) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }
    setLocalRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId ? { ...r, absent: isChecked, obtainedMarks: isChecked ? '' : r.obtainedMarks } : r,
      ),
    );
  };

  const handleCellChange = (studentId, index, value) =>
    setLocalRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, absent: false, changed: true, cells: r.cells.map((c, i) => (i === index ? value : c)) }
          : r,
      ),
    );

  const handleQuestionAbsent = (studentId, absent) =>
    setLocalRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, absent, changed: true, cells: absent ? r.cells.map(() => '') : r.cells }
          : r,
      ),
    );

  const reloadSheet = async () => sheet.setData(await http.get(sheetPath));

  const questionEntries = () =>
    localRows.map((r) =>
      buildQuestionEntry({
        studentId: r.studentId,
        absent: r.absent,
        cells: r.cells,
        status: r.status,
        savedTotal: r.saved.obtainedMarks,
        savedQuestionMarks: r.saved.questionMarks,
        savedAbsent: r.saved.absent,
      }),
    );

  const handleSave = async (submit) => {
    if (hasQuestions && localRows.some((r) => !r.absent && rowHasCellErrors(r.cells, questions))) {
      setSaveError(t('marks.fixQuestionMarks'));
      return;
    }
    if (!hasQuestions && Object.keys(validationErrors).length > 0) {
      setSaveError('Please fix the highlighted marks before saving.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await http.put(`/exam-schedules/${paper.id}/marks`, {
        submit,
        // An emptied box on a row that had saved marks deletes them (clear); other blanks are skipped.
        entries: hasQuestions
          ? questionEntries()
          : localRows.map((r) => {
          const blank = !r.absent && r.obtainedMarks === '';
          return {
            studentId: r.studentId,
            obtainedMarks: r.absent || blank ? null : Number(r.obtainedMarks),
            absent: Boolean(r.absent),
            clear: blank && r.status !== 'Not Entered',
          };
        }),
      });
      sheet.setData(updated);
      onSaved?.(submit ? 'Marks submitted successfully.' : 'Marks saved as draft.');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentExam) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <EmptyMessage text="No examinations yet. Create an exam first." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Examination *</label>
          <select
            value={currentExam.id}
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
            value={className}
            onChange={(e) => setChosenClass(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
          >
            {examClasses.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Paper *</label>
          <select
            value={paper?.id || ''}
            onChange={(e) => setChosenPaperId(e.target.value)}
            disabled={paperList.length === 0}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
          >
            {paperList.length === 0 && <option value="">No papers scheduled</option>}
            {paperList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.subject} — {formatDate(p.date)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AsyncState state={papers} loadingText="Loading papers…">
        {() =>
          !paper ? (
            <EmptyMessage text={`No papers are scheduled for Class ${className} in this exam. Add one from the exam's schedule page.`} />
          ) : (
            <AsyncState state={sheet} loadingText="Loading marks sheet…">
              {() => (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                    <QuestionsEditor
                      schedule={sheet.data?.schedule}
                      hasUnsavedMarks={localRows.some((r) => r.changed)}
                      onChanged={reloadSheet}
                    />
                    <MarksImportPanel sheet={sheet.data} onSheetReloaded={sheet.setData} />
                  </div>

                  {hasQuestions && localRows.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-slate-500">{t('marks.gridHint')}</p>
                      <QuestionMarksGrid
                        questions={questions}
                        maxMarks={maxMarks}
                        rows={localRows.map((r) => ({
                          studentId: r.studentId,
                          studentName: r.studentName,
                          rollNumber: r.rollNumber,
                          status: r.status,
                          absent: Boolean(r.absent),
                          cells: r.cells,
                          changed: r.changed,
                          savedTotal: r.saved.obtainedMarks,
                          savedQuestionMarks: r.saved.questionMarks,
                        }))}
                        onCellChange={handleCellChange}
                        onAbsentChange={handleQuestionAbsent}
                        renderGrade={(total) => (
                          <span className="block text-[10px] font-bold text-slate-500">
                            {gradeFor(maxMarks > 0 ? (total / maxMarks) * 100 : null, gradeBands)}
                          </span>
                        )}
                      />
                    </div>
                  ) : (
                  /* Roster & Marks Entry Table */
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
                              No students in Class {className}.
                            </td>
                          </tr>
                        ) : (
                          localRows.map((r) => {
                            const hasMarks = r.obtainedMarks !== '' && !r.absent;
                            const percent = hasMarks && maxMarks > 0 ? Math.round((Number(r.obtainedMarks) / maxMarks) * 100) : null;
                            const grade = r.absent ? 'AB' : gradeFor(percent, gradeBands);
                            const hasErr = !!validationErrors[r.studentId];

                            return (
                              <tr key={r.studentId} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3 font-bold text-slate-900">{r.studentName}</td>
                                <td className="py-3 px-3 text-slate-600">{r.rollNumber}</td>
                                <td className="py-3 px-3 text-slate-400 font-medium">{r.studentId}</td>
                                <td className="py-3 px-3 text-center text-slate-700 font-bold">{maxMarks}</td>

                                <td className="py-2 px-3 text-center">
                                  <div className="relative inline-block w-24">
                                    <input
                                      type="number"
                                      disabled={r.absent}
                                      value={r.absent ? '' : r.obtainedMarks}
                                      onChange={(e) => handleMarksInput(r.studentId, e.target.value)}
                                      placeholder="—"
                                      className={`w-full text-center px-2.5 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold transition-all ${
                                        hasErr
                                          ? 'border-rose-500 text-rose-600 bg-rose-50 focus:ring-2 focus:ring-rose-200'
                                          : 'border-slate-200 text-slate-900 focus:border-[#FF6B2C]'
                                      } ${r.absent ? 'opacity-40 bg-slate-100' : ''}`}
                                    />
                                    {hasErr && (
                                      <span className="block text-[10px] font-bold text-rose-500 mt-0.5 whitespace-nowrap">
                                        {validationErrors[r.studentId]}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-center font-bold text-slate-900">
                                  {r.absent ? '—' : percent == null ? '—' : `${percent}%`}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-extrabold text-xs ${
                                      r.absent
                                        ? 'bg-rose-50 text-rose-700'
                                        : grade.startsWith('A')
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {grade}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(r.absent)}
                                    onChange={(e) => handleAbsentToggle(r.studentId, e.target.checked)}
                                    className="w-4 h-4 text-[#FF6B2C] border-slate-300 rounded focus:ring-[#FF6B2C] cursor-pointer"
                                  />
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      r.status === 'Submitted'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                  >
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
                  )}

                  {saveError && <p className="text-xs font-semibold text-rose-600">{saveError}</p>}

                  {/* Save Actions Bar */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={saving || localRows.length === 0}
                      onClick={() => handleSave(false)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <Save className="w-4 h-4 text-slate-400" />
                      <span>{saving ? tx('Saving…') : tx('Save Draft')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={saving || localRows.length === 0}
                      onClick={() => handleSave(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Marks</span>
                    </button>
                  </div>
                </>
              )}
            </AsyncState>
          )
        }
      </AsyncState>
    </div>
  );
};
