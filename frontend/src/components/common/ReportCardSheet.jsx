import React from 'react';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { AsyncState } from '@/components/common/AsyncState';
import { SchoolLetterhead } from '@/components/common/SchoolLetterhead';
import { formatDate } from '@/utils';

const TERMS = ['Term 1', 'Term 2'];

const cell = 'border border-slate-300 px-2 py-1.5';
const headCell = `${cell} bg-slate-100 font-bold text-slate-700`;

const marksText = (result) => {
  if (!result) return '—';
  if (result.absent) return 'AB';
  if (result.obtainedMarks == null) return '—';
  return `${result.obtainedMarks}/${result.maxMarks}`;
};

const pctText = (value) => (value == null ? '—' : `${value}%`);

const Detail = ({ label, value }) => (
  <div className="flex gap-2 text-xs">
    <span className="text-slate-500 font-semibold w-32 shrink-0">{label}</span>
    <span className="font-bold text-slate-900">{value || '—'}</span>
  </div>
);

/** The printable CBSE-style report card itself, from the GET /report-cards/{id} payload. */
export const ReportCardContent = ({ card }) => {
  const student = card.student || {};
  const exams = card.exams || [];
  const subjects = card.subjects || [];
  const overall = card.overall || {};
  const attendance = card.attendance;
  const notes = card.notes || [];
  const areas = card.coScholasticAreas || [];
  const noteFor = (term) => notes.find((n) => n.term === term);
  const remarks = TERMS.map((term) => [term, noteFor(term)?.remark]).filter(([, remark]) => remark);

  return (
    <div className="print-sheet bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-6 text-slate-900">
      <SchoolLetterhead
        school={card.school}
        title="Report Card"
        subtitle={card.academicYear ? `Academic Session ${card.academicYear}` : undefined}
      />

      {/* Student details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
        <Detail label="Student name" value={student.name} />
        <Detail label="Admission no." value={student.id} />
        <Detail label="Class & section" value={student.className} />
        <Detail label="Roll number" value={student.rollNumber != null ? String(student.rollNumber) : null} />
        <Detail label="Date of birth" value={student.dateOfBirth ? formatDate(student.dateOfBirth) : null} />
        <Detail
          label="Parent / guardian"
          value={student.guardian?.name ? `${student.guardian.name}${student.guardian.relation ? ` (${student.guardian.relation})` : ''}` : null}
        />
        <Detail label="Class teacher" value={card.classTeacher} />
        <Detail label="Admission date" value={student.admissionDate ? formatDate(student.admissionDate) : null} />
      </div>

      {/* Scholastic */}
      <section className="space-y-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Part 1 — Scholastic areas</h4>
        {subjects.length === 0 ? (
          <p className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl p-4 text-center">
            No results are available for this session yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-center">
              <thead>
                <tr>
                  <th className={`${headCell} text-left`}>Subject</th>
                  {exams.map((exam) => (
                    <th key={exam.id} className={headCell}>
                      {exam.name}
                    </th>
                  ))}
                  <th className={headCell}>Total</th>
                  <th className={headCell}>%</th>
                  <th className={headCell}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((row) => (
                  <tr key={row.subject}>
                    <td className={`${cell} text-left font-bold`}>{row.subject}</td>
                    {exams.map((exam) => {
                      const result = row.marks?.[exam.id];
                      return (
                        <td key={exam.id} className={`${cell} ${result && !result.passed ? 'text-rose-700 font-bold' : ''}`}>
                          {marksText(result)}
                        </td>
                      );
                    })}
                    <td className={`${cell} font-bold`}>
                      {row.totalObtained}/{row.totalMax}
                    </td>
                    <td className={cell}>{pctText(row.percentage)}</td>
                    <td className={`${cell} font-extrabold`}>{row.grade || '—'}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td className={`${cell} text-left font-extrabold`} colSpan={exams.length + 1}>
                    Overall
                  </td>
                  <td className={`${cell} font-extrabold`}>
                    {overall.totalObtained ?? '—'}/{overall.totalMax ?? '—'}
                  </td>
                  <td className={`${cell} font-extrabold`}>{pctText(overall.percentage)}</td>
                  <td className={`${cell} font-extrabold`}>{overall.grade || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Co-scholastic */}
      {areas.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Part 2 — Co-scholastic areas <span className="font-semibold normal-case">(graded A / B / C)</span>
          </h4>
          <table className="w-full border-collapse text-xs text-center">
            <thead>
              <tr>
                <th className={`${headCell} text-left`}>Area</th>
                {TERMS.map((term) => (
                  <th key={term} className={headCell}>
                    {term}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area}>
                  <td className={`${cell} text-left font-semibold`}>{area}</td>
                  {TERMS.map((term) => (
                    <td key={term} className={`${cell} font-bold`}>
                      {noteFor(term)?.coScholastic?.[area] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Attendance */}
        <section className="rounded-2xl border border-slate-200 p-4 space-y-1.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Attendance</h4>
          {attendance && attendance.workingDays > 0 ? (
            <>
              <p className="text-xs">
                <span className="font-bold">{(attendance.present ?? 0) + (attendance.late ?? 0)}</span> of{' '}
                <span className="font-bold">{attendance.workingDays}</span> working days attended
                {attendance.rate != null ? ` (${attendance.rate}%)` : ''}
              </p>
              <p className="text-[11px] text-slate-500">
                Absent {attendance.absent ?? 0} · Leave {attendance.leave ?? 0} · Late {attendance.late ?? 0}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">No attendance recorded for this session.</p>
          )}
        </section>

        {/* Result */}
        <section className="rounded-2xl border border-slate-200 p-4 space-y-1.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Result</h4>
          <p
            className={`text-sm font-extrabold ${
              overall.result === 'Pass' ? 'text-emerald-700' : overall.result ? 'text-amber-700' : 'text-slate-500'
            }`}
          >
            {overall.result || 'Not available yet'}
          </p>
          {overall.failedSubjects?.length > 0 && (
            <p className="text-[11px] text-slate-600">Needs improvement in: {overall.failedSubjects.join(', ')}</p>
          )}
        </section>
      </div>

      {/* Remarks */}
      <section className="rounded-2xl border border-slate-200 p-4 space-y-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Class teacher&apos;s remarks</h4>
        {remarks.length === 0 ? (
          <p className="text-xs text-slate-500">No remarks yet.</p>
        ) : (
          remarks.map(([term, remark]) => (
            <p key={term} className="text-xs leading-relaxed">
              <span className="font-bold">{term}:</span> {remark}
            </p>
          ))
        )}
      </section>

      {/* Grade scale */}
      {card.gradeBands?.length > 0 && (
        <p className="text-[10px] text-slate-500">
          <span className="font-bold">Grading scale:</span>{' '}
          {card.gradeBands.map((band) => `${band.grade} (${band.min}–${band.max}%)`).join('  ·  ')}
        </p>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs text-slate-600">
        <div className="border-t border-slate-400 pt-2 font-bold">
          Class Teacher
          {card.classTeacher && <span className="block font-medium text-[10px]">{card.classTeacher}</span>}
        </div>
        <div className="border-t border-slate-400 pt-2 font-bold">
          Principal
          {card.school?.principalName && (
            <span className="block font-medium text-[10px]">{card.school.principalName}</span>
          )}
        </div>
        <div className="border-t border-slate-400 pt-2 font-bold">Parent / Guardian</div>
      </div>
    </div>
  );
};

/** Loads and shows the report card of `studentId` (optionally for another `academicYear`). */
export const ReportCardSheet = ({ studentId, academicYear }) => {
  const card = useApi(
    studentId ? withQuery(`/report-cards/${encodeURIComponent(studentId)}`, { academicYear }) : null,
  );
  if (!studentId) return null;
  return (
    <AsyncState state={card} loadingText="Loading report card…">
      {(data) => <ReportCardContent card={data} />}
    </AsyncState>
  );
};

export default ReportCardSheet;
