import React, { useMemo } from 'react';
import { Award, Printer, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { aggregateBySubject, bandFor, groupByExam } from './resultsUtils';

export const StudentReportCardPage = () => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.studentId || currentUser?.id;
  const className = currentUser?.className;

  const results = useApi(studentId ? `/results/students/${studentId}` : null);
  const meta = useApi('/meta');
  const classInfo = useApi(className ? `/classes/${encodeURIComponent(className)}` : null);
  const attendance = useApi(studentId ? `/attendance/students/${studentId}/stats` : null);

  const academicYear = meta.data?.academicYear || classInfo.data?.academicYear || '';
  const gradeBands = meta.data?.gradeBands;

  // Exams oldest → newest as columns, subjects as rows.
  const exams = useMemo(() => [...groupByExam(results.data?.subjects)].reverse(), [results.data]);
  const subjects = useMemo(() => aggregateBySubject(results.data?.subjects), [results.data]);

  const overall = results.data?.percentage ?? null;
  const overallBand = bandFor(overall, gradeBands);
  const failedSubjects = (results.data?.subjects || []).filter((s) => !s.passed).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Award className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>Academic Report Card</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Published results{academicYear ? ` for Academic Session ${academicYear}` : ''}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4 stroke-[2]" />
          <span>Print Report</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-8 print:border-none print:shadow-none">
        {/* School Header */}
        <div className="text-center border-b border-slate-100 pb-6 space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-[#FF6B2C]/20">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Shiv Shanti Adarsh Academy
          </h2>
          <p className="text-xs font-semibold text-slate-500">Academic Evaluation Card</p>
          {academicYear && (
            <span className="inline-block px-3 py-1 bg-orange-100 text-[#FF6B2C] font-bold rounded-full text-xs mt-1">
              Session: {academicYear}
            </span>
          )}
        </div>

        {/* Student Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block">Student Name:</span>
            <span className="font-extrabold text-slate-900 text-sm">{currentUser?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Roll Number:</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {currentUser?.rollNumber != null ? `#${currentUser.rollNumber}` : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Class & Section:</span>
            <span className="font-extrabold text-slate-900 text-sm">{className ? `Class ${className}` : '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Class Teacher:</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {classInfo.loading ? '…' : classInfo.data?.classTeacherName || 'Not assigned'}
            </span>
          </div>
        </div>

        <AsyncState state={results} loadingText="Loading results…">
          {() =>
            subjects.length === 0 ? (
              <EmptyMessage text="No results have been published for you yet." />
            ) : (
              <>
                {/* Grades Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-5">Subject</th>
                        {exams.map((exam) => (
                          <th key={exam.examId} className="py-3.5 px-4">
                            {exam.examName}
                          </th>
                        ))}
                        <th className="py-3.5 px-4">Total Marks</th>
                        <th className="py-3.5 px-4">Percentage</th>
                        <th className="py-3.5 px-4">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects.map((row) => {
                        const grade = bandFor(row.avgPct, gradeBands)?.grade;
                        return (
                          <tr key={row.subject} className="hover:bg-slate-50/50">
                            <td className="py-4 px-5 font-bold text-slate-900">{row.subject}</td>
                            {exams.map((exam) => {
                              const r = row.results.find((x) => x.examId === exam.examId);
                              return (
                                <td key={exam.examId} className="py-4 px-4 font-semibold text-slate-600">
                                  {!r ? '—' : r.absent ? 'Absent' : `${r.obtainedMarks ?? '—'} / ${r.maxMarks}`}
                                </td>
                              );
                            })}
                            <td className="py-4 px-4 font-extrabold text-slate-900">
                              {row.totalObtained} / {row.totalMax}
                            </td>
                            <td className="py-4 px-4 font-bold text-[#FF6B2C]">
                              {row.avgPct != null ? `${row.avgPct}%` : '—'}
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg font-black text-xs border ${
                                  grade === 'F'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {grade ?? '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Overall Evaluation Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-center">
                    <span className="text-xs font-bold text-emerald-800">Overall Percentage</span>
                    <h4 className="text-2xl font-black text-emerald-900 mt-1">{overall != null ? `${overall}%` : '—'}</h4>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {results.data.totalObtained} / {results.data.totalMaxMarks} marks
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-center">
                    <span className="text-xs font-bold text-blue-800">Overall Grade</span>
                    <h4 className="text-2xl font-black text-blue-900 mt-1">
                      {results.data.grade ? `Grade ${results.data.grade}` : '—'}
                      {overallBand?.label ? ` (${overallBand.label})` : ''}
                    </h4>
                    <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                      {failedSubjects === 0
                        ? 'Passed in every paper'
                        : `Below passing marks in ${failedSubjects} paper${failedSubjects > 1 ? 's' : ''}`}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl text-center">
                    <span className="text-xs font-bold text-orange-800">Attendance</span>
                    <h4 className="text-2xl font-black text-orange-900 mt-1">
                      {attendance.data?.rate != null ? `${attendance.data.rate}%` : '—'}
                    </h4>
                    <p className="text-[11px] text-orange-700 font-semibold mt-0.5">
                      {attendance.data
                        ? `${(attendance.data.present ?? 0) + (attendance.data.late ?? 0)} of ${attendance.data.workingDays ?? 0} working days`
                        : attendance.error
                          ? attendance.error.message
                          : 'Loading…'}
                    </p>
                  </div>
                </div>
              </>
            )
          }
        </AsyncState>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs text-slate-500">
          <div className="border-t border-slate-300 pt-2 font-bold">Class Teacher Signature</div>
          <div className="border-t border-slate-300 pt-2 font-bold">Parent Signature</div>
          <div className="border-t border-slate-300 pt-2 font-bold">Principal Signature</div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportCardPage;
