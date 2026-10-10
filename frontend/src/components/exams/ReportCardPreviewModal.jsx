import React from 'react';
import { X, Printer, Download, GraduationCap, Award } from 'lucide-react';
import { withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate } from '@/utils';

// When printing, show only the report card (not the page behind the modal).
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #report-card-print, #report-card-print * { visibility: visible !important; }
  #report-card-print { position: absolute; left: 0; top: 0; width: 100%; }
}`;

const pct = (value) => (value == null ? '—' : `${value}%`);

/**
 * Report card for one student and one exam, built from GET /results/students/{id}?examId=,
 * the student record and their attendance stats.
 */
export const ReportCardPreviewModal = ({ isOpen, onClose, studentId, exam }) => {
  const active = isOpen && studentId && exam;
  const result = useApi(active ? withQuery(`/results/students/${studentId}`, { examId: exam.id }) : null);
  const student = useApi(active ? `/students/${studentId}` : null);
  const attendance = useApi(active ? `/attendance/students/${studentId}/stats` : null);

  if (!active) return null;

  const handleDownloadText = () => {
    const r = result.data;
    if (!r) return;
    const s = student.data || {};
    const line = '-'.repeat(68);
    const rows = r.subjects.map(
      (sub) =>
        `${sub.subject.padEnd(22)}${String(sub.maxMarks).padEnd(8)}${String(
          sub.absent ? 'AB' : sub.obtainedMarks ?? '—',
        ).padEnd(10)}${pct(sub.percentage).padEnd(10)}${String(sub.grade ?? '—').padEnd(7)}${
          sub.passed ? 'Pass' : 'Fail'
        }`,
    );
    const text = [
      'SSA SHIV SHANTI ADARSH ACADEMY',
      `REPORT CARD — ${exam.name}${exam.academicYear ? ` (${exam.academicYear})` : ''}`,
      line,
      `Student Name: ${r.studentName}`,
      `Student ID:   ${r.studentId}`,
      `Class:        ${r.className}`,
      `Roll Number:  ${s.rollNumber ?? '—'}`,
      line,
      `${'Subject'.padEnd(22)}${'Max'.padEnd(8)}${'Marks'.padEnd(10)}${'%'.padEnd(10)}${'Grade'.padEnd(7)}Result`,
      line,
      ...(rows.length ? rows : ['No marks recorded for this exam.']),
      line,
      `Total Marks:  ${r.totalObtained} / ${r.totalMaxMarks}`,
      `Percentage:   ${pct(r.percentage)}`,
      `Grade:        ${r.grade ?? '—'}`,
      '',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ReportCard_${r.studentId}_${exam.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <style>{PRINT_CSS}</style>
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Action Header Bar (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Official Student Report Card</h3>
              <p className="text-xs text-slate-400">Printable A4 report card preview</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!result.data}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadText}
              disabled={!result.data}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-[#FF6B2C]/20 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>Download .txt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AsyncState state={result} loadingText="Loading report card…">
          {(r) => {
            const s = student.data || {};
            const failedAny = r.subjects.some((sub) => !sub.passed);
            return (
              <div
                id="report-card-print"
                className="border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 print:border-none print:p-0"
              >
                {/* School Header */}
                <div className="text-center border-b-2 border-[#FF6B2C] pb-4">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center font-bold">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                      SSA SHIV SHANTI ADARSH ACADEMY
                    </h1>
                  </div>
                  {exam.academicYear && (
                    <p className="text-xs font-semibold text-slate-500">Session {exam.academicYear}</p>
                  )}
                  <div className="mt-3 inline-block px-5 py-1 bg-amber-50 border border-amber-200 text-[#FF6B2C] font-black text-xs uppercase tracking-widest rounded-full">
                    REPORT CARD — {exam.name.toUpperCase()}
                  </div>
                </div>

                {/* Student Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Student Name</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{r.studentName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Student ID</p>
                    <p className="font-bold text-slate-700 mt-0.5">{r.studentId}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Class &amp; Section</p>
                    <p className="font-bold text-slate-700 mt-0.5">Class {r.className}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Roll Number</p>
                    <p className="font-bold text-slate-700 mt-0.5">{s.rollNumber ?? '—'}</p>
                  </div>
                </div>

                {/* Subject Marks Table */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Subject-Wise Performance
                  </h4>
                  {r.subjects.length === 0 ? (
                    <EmptyMessage text="No marks have been recorded for this student in this exam yet." />
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b-2 border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3 text-center">Date</th>
                          <th className="py-2 px-3 text-center">Max Marks</th>
                          <th className="py-2 px-3 text-center">Obtained Marks</th>
                          <th className="py-2 px-3 text-center">Percentage</th>
                          <th className="py-2 px-3 text-center">Grade</th>
                          <th className="py-2 px-3 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        {r.subjects.map((row) => (
                          <tr key={`${row.subject}-${row.date}`}>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{row.subject}</td>
                            <td className="py-2.5 px-3 text-center text-slate-500">{formatDate(row.date)}</td>
                            <td className="py-2.5 px-3 text-center text-slate-600">{row.maxMarks}</td>
                            <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">
                              {row.absent ? 'Absent' : row.obtainedMarks ?? '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800">{pct(row.percentage)}</td>
                            <td className="py-2.5 px-3 text-center font-black text-emerald-700">{row.grade ?? '—'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  row.passed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {row.passed ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Overall Result & Attendance Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-2">
                    <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider">Overall Academic Result</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <div>
                        <p className="text-slate-500 text-[10px]">Total Marks</p>
                        <p className="text-slate-900 text-sm font-black">
                          {r.totalObtained} / {r.totalMaxMarks}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Percentage</p>
                        <p className="text-[#FF6B2C] text-sm font-black">{pct(r.percentage)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Grade</p>
                        <p className="text-slate-900">{r.grade ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Final Status</p>
                        {r.subjects.length === 0 ? (
                          <p className="text-slate-500 font-black">—</p>
                        ) : (
                          <p className={`font-black ${failedAny ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {failedAny ? 'NOT PASSED IN ALL SUBJECTS' : 'PASS'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 space-y-2">
                    <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">Attendance Performance</h4>
                    {attendance.data ? (
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <div>
                          <p className="text-slate-500 text-[10px]">Working Days</p>
                          <p className="text-slate-900">{attendance.data.workingDays} Days</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px]">Present / Absent</p>
                          <p className="text-slate-900">
                            {attendance.data.present} / {attendance.data.absent}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-500 text-[10px]">Attendance Rate</p>
                          <p className="text-indigo-700 font-black text-sm">{pct(attendance.data.rate)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        {attendance.error ? 'Attendance not available.' : 'Loading attendance…'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Signatures Footer */}
                <div className="grid grid-cols-3 gap-4 pt-10 text-center text-xs font-bold text-slate-700">
                  <div>
                    <div className="border-b border-slate-300 pb-1 mb-1">Class Teacher</div>
                    <span className="text-[10px] font-normal text-slate-400">Signature</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-300 pb-1 mb-1">Principal</div>
                    <span className="text-[10px] font-normal text-slate-400">Signature &amp; Stamp</span>
                  </div>
                  <div>
                    <div className="border-2 border-dashed border-amber-300 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-[9px] font-black text-amber-700 uppercase leading-tight p-1">
                      Official Seal
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        </AsyncState>
      </div>
    </div>
  );
};
