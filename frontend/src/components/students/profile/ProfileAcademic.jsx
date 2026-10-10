import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, FileText, CheckCircle2 } from 'lucide-react';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { formatDate } from '@/utils';

const gradeFor = (bands, percentage) => {
  if (!bands || percentage === null || percentage === undefined) return '—';
  const rounded = Math.round(percentage);
  return bands.find((b) => rounded >= b.min && rounded <= b.max)?.grade ?? '—';
};

const isGood = (grade) => String(grade).startsWith('A') || String(grade).startsWith('B');

/** Exam results from GET /results/students/{id}; grade bands from GET /meta. */
export const ProfileAcademic = ({ student }) => {
  const navigate = useNavigate();
  const results = useApi(`/results/students/${encodeURIComponent(student.id)}`);
  const meta = useApi('/meta');

  return (
    <AsyncState state={results} loadingText="Loading results…">
      {(result) => (
        <AcademicContent
          student={student}
          result={result}
          bands={meta.data?.gradeBands}
          onOpenExam={(examId) => navigate(`/admin/exams/${examId}`)}
        />
      )}
    </AsyncState>
  );
};

const AcademicContent = ({ student, result, bands, onOpenExam }) => {
  const subjects = useMemo(() => result?.subjects || [], [result]);

  // Only papers with marks (or marked absent) count.
  const graded = useMemo(
    () => subjects.filter((s) => s.absent || (s.obtainedMarks !== null && s.obtainedMarks !== undefined)),
    [subjects],
  );

  const bySubject = useMemo(() => {
    const map = new Map();
    graded.forEach((s) => {
      if (!map.has(s.subject)) map.set(s.subject, []);
      map.get(s.subject).push(s);
    });
    return [...map.entries()];
  }, [graded]);

  const exams = useMemo(() => {
    const map = new Map();
    graded.forEach((s) => {
      const exam = map.get(s.examId) || { examId: s.examId, examName: s.examName, date: s.date, max: 0, obtained: 0, failed: false };
      exam.max += Number(s.maxMarks || 0);
      exam.obtained += s.absent ? 0 : Number(s.obtainedMarks || 0);
      exam.failed = exam.failed || s.passed === false;
      if (s.date < exam.date) exam.date = s.date;
      map.set(s.examId, exam);
    });
    return [...map.values()]
      .map((e) => ({ ...e, percentage: e.max ? Math.round((e.obtained * 1000) / e.max) / 10 : null }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [graded]);

  const overall = result?.percentage;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Current Class</p>
            <p className="text-xl font-bold text-slate-900">Class {student.className}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Overall Performance</p>
            <p className="text-xl font-bold text-slate-900">
              {graded.length && overall !== null && overall !== undefined
                ? `${result.grade || gradeFor(bands, overall)} (${overall}%)`
                : 'No marks yet'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Marks</p>
            <p className="text-xl font-bold text-slate-900">
              {graded.length ? `${result.totalObtained} / ${result.totalMaxMarks}` : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Subject Performance</h3>
          {bySubject.length === 0 ? (
            <EmptyMessage text="No marks have been recorded for this student yet." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bySubject.map(([subject, records]) => (
                <div key={subject} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-slate-900">{subject}</h4>
                  </div>
                  <div className="space-y-2">
                    {records.map((record) => (
                      <div key={`${record.examId}-${record.subject}`} className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{record.examName}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-700">
                            {record.absent ? 'Absent' : `${record.obtainedMarks} / ${record.maxMarks}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              isGood(record.grade) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {record.grade || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Examination History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Examination History</h3>
              <p className="text-xs text-slate-500">Totals per exam from the recorded marks</p>
            </div>
          </div>

          {exams.length === 0 ? (
            <EmptyMessage text="No exam results yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Exam</th>
                    <th className="py-3 px-4">Marks</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {exams.map((exam) => {
                    const grade = gradeFor(bands, exam.percentage);
                    return (
                      <tr key={exam.examId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{exam.examName}</div>
                          <div className="text-xs text-slate-400">{formatDate(exam.date)}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{exam.obtained} / {exam.max}</td>
                        <td className="py-3 px-4 text-slate-700">{exam.percentage ?? '—'}%</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">{grade}</span>
                        </td>
                        <td className="py-3 px-4">
                          {exam.failed ? (
                            <span className="text-rose-600 font-bold text-xs">Fail in a subject</span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-xs">Pass</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenExam(exam.examId)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" /> Open Exam
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
