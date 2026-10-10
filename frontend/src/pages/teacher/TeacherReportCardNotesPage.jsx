import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, NotebookPen, Printer, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDateTime } from '@/utils';
import { useI18n } from '@/i18n/translate';

const TERMS = ['Term 1', 'Term 2'];
const GRADES = ['A', 'B', 'C'];
const GRADE_HINTS = { A: 'Outstanding', B: 'Very good', C: 'Fair' };

const selectClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-[#FF6B2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/15';

/** Co-scholastic grades + remark for one student and term. Keyed by student/term so it starts from saved data. */
const NotesForm = ({ card, term, studentId, onSaved, onNext }) => {
  const { tx } = useI18n();
  const areas = card.coScholasticAreas || [];
  const existing = (card.notes || []).find((n) => n.term === term);
  const [grades, setGrades] = useState(() => {
    const initial = {};
    areas.forEach((area) => {
      initial[area] = existing?.coScholastic?.[area] || '';
    });
    return initial;
  });
  const [remark, setRemark] = useState(existing?.remark || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async (goNext) => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const coScholastic = {};
      Object.entries(grades).forEach(([area, grade]) => {
        if (grade) coScholastic[area] = grade;
      });
      await http.put(`/report-cards/${encodeURIComponent(studentId)}/notes`, {
        term,
        academicYear: card.academicYear,
        remark: remark.trim(),
        coScholastic,
      });
      setSaved(true);
      onSaved();
      if (goNext && onNext) onNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
      className="space-y-5"
    >
      {existing?.updatedAt && (
        <p className="text-[11px] text-slate-400">
          Last saved {formatDateTime(existing.updatedAt)}
          {existing.updatedBy ? ` by ${existing.updatedBy}` : ''}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Co-scholastic area</th>
              <th className="py-3 px-4">Grade ({term})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {areas.map((area) => (
              <tr key={area}>
                <td className="py-3 px-4 font-semibold text-slate-800">{area}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((grade) => {
                      const active = grades[area] === grade;
                      return (
                        <button
                          key={grade}
                          type="button"
                          title={GRADE_HINTS[grade]}
                          onClick={() => {
                            setGrades((g) => ({ ...g, [area]: active ? '' : grade }));
                            setSaved(false);
                          }}
                          className={`w-10 h-9 rounded-xl text-sm font-extrabold border cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-[#FF6B2C]/50'
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400">A = Outstanding · B = Very good · C = Fair. Click a selected grade again to clear it.</p>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-slate-600">Class teacher&apos;s remark ({term})</span>
        <textarea
          rows={3}
          value={remark}
          onChange={(e) => {
            setRemark(e.target.value);
            setSaved(false);
          }}
          placeholder="e.g. Attentive in class and participates well; should practise written work regularly."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#FF6B2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/15"
        />
      </label>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {saved && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Notes saved.
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onNext && (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-2xl disabled:opacity-60 cursor-pointer"
          >
            Save &amp; next student <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? tx('Saving…') : tx('Save notes')}
        </button>
      </div>
    </form>
  );
};

const StudentNotes = ({ studentId, term, onNext }) => {
  const card = useApi(`/report-cards/${encodeURIComponent(studentId)}`);
  return (
    <AsyncState state={card} loadingText="Loading report card…">
      {(data) => (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{data.student?.name}</h2>
              <p className="text-xs text-slate-500">
                Class {data.student?.className} · Roll #{data.student?.rollNumber ?? '—'} · Session {data.academicYear}
                {data.overall?.percentage != null ? ` · Overall ${data.overall.percentage}% (${data.overall.grade})` : ''}
              </p>
            </div>
            <Link
              to={`/report-card/${encodeURIComponent(studentId)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFF5F0] hover:bg-orange-100 text-[#FF6B2C] text-xs font-bold border border-orange-200/60 self-start"
            >
              <Printer className="w-3.5 h-3.5" /> View printable report card
            </Link>
          </div>
          <NotesForm
            key={`${studentId}-${term}`}
            card={data}
            term={term}
            studentId={studentId}
            onSaved={card.reload}
            onNext={onNext}
          />
        </div>
      )}
    </AsyncState>
  );
};

/** /teacher/report-cards — co-scholastic grades and remarks for the report cards of the teacher's classes. */
export const TeacherReportCardNotesPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const classes = currentUser?.assignedClasses ?? [];
  const [className, setClassName] = useState(classes[0] ?? '');
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState(TERMS[0]);

  const students = useApi(className ? `/classes/${encodeURIComponent(className)}/students` : null);
  const list = students.data || [];
  const index = list.findIndex((s) => s.id === studentId);
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;
  const prev = index > 0 ? list[index - 1] : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <NotebookPen className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>{tx('Report Card Notes')}</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Grade co-scholastic areas and write the class teacher&apos;s remark for each term. Marks come from the exams
          automatically.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <EmptyMessage text="You are not assigned to any class yet." />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[160px_1fr_160px] gap-3 items-end">
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-500">Class</span>
              <select
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setStudentId('');
                }}
                className={selectClass}
              >
                {classes.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-500">Student</span>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={!students.data}
                className={selectClass}
              >
                <option value="">{students.loading ? 'Loading students…' : 'Choose a student'}</option>
                {list.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rollNumber != null ? `${s.rollNumber}. ` : ''}
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-slate-500">Term</span>
              <select value={term} onChange={(e) => setTerm(e.target.value)} className={selectClass}>
                {TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
            {students.error && !students.data ? (
              <AsyncState state={students} />
            ) : students.data && list.length === 0 ? (
              <EmptyMessage text={`No students in Class ${className}.`} />
            ) : !studentId ? (
              <EmptyMessage text="Choose a student to write their report card notes." />
            ) : (
              <div className="space-y-5">
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => prev && setStudentId(prev.id)}
                    disabled={!prev}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                  >
                    <ChevronLeft className="w-4 h-4" /> {prev ? prev.name : 'Previous'}
                  </button>
                  <button
                    type="button"
                    onClick={() => next && setStudentId(next.id)}
                    disabled={!next}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                  >
                    {next ? next.name : 'Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <StudentNotes
                  key={studentId}
                  studentId={studentId}
                  term={term}
                  onNext={next ? () => setStudentId(next.id) : undefined}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherReportCardNotesPage;
