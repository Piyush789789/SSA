import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ListOrdered } from 'lucide-react';
import { useI18n } from '@/i18n/translate';
import { barPercent, fmtMark, hasQuestionBreakdown, questionTone } from './questionMarks';

const TONES = {
  full: { chip: 'bg-emerald-50 border-emerald-200 text-emerald-800', bar: 'bg-emerald-500' },
  ok: { chip: 'bg-white border-slate-200 text-slate-800', bar: 'bg-[#FF6B2C]' },
  weak: { chip: 'bg-rose-50 border-rose-200 text-rose-800', bar: 'bg-rose-500' },
  none: { chip: 'bg-slate-50 border-slate-200 text-slate-500', bar: 'bg-slate-300' },
};

/**
 * Question-wise marks of one subject result for students and parents: a chip per question ("Q1 3/5") with a mini
 * bar — full marks in green, weak answers (< 40 %) in red, "Not attempted" for blank ones. Shows "Absent" when the
 * student was absent, and a note when only the total was entered.
 */
export const QuestionBreakdown = ({ subject }) => {
  const { t } = useI18n();
  if (!hasQuestionBreakdown(subject)) return null;

  if (subject.absent) {
    return <p className="text-xs font-bold text-rose-600">{t('marks.wasAbsent')}</p>;
  }
  if (!Array.isArray(subject.questionMarks)) {
    return <p className="text-xs font-medium text-slate-500">{t('marks.onlyTotalEntered')}</p>;
  }

  const weak = subject.questions.filter((q, i) => questionTone(subject.questionMarks[i], q.maxMarks) === 'weak').length;
  const full = subject.questions.filter((q, i) => questionTone(subject.questionMarks[i], q.maxMarks) === 'full').length;

  return (
    <div className="space-y-2">
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" aria-label={t('marks.questionWise')}>
        {subject.questions.map((q, i) => {
          const mark = subject.questionMarks[i] ?? null;
          const tone = questionTone(mark, q.maxMarks);
          const style = TONES[tone];
          return (
            <li key={q.label} className={`rounded-xl border px-2.5 py-2 ${style.chip}`} data-tone={tone}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-extrabold">{q.label}</span>
                <span className="font-bold whitespace-nowrap">
                  {mark == null ? t('marks.notAttempted') : `${fmtMark(mark)}/${fmtMark(q.maxMarks)}`}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${barPercent(mark, q.maxMarks)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] font-medium text-slate-500">
        {t('marks.breakdownLegend', { full, weak })}
      </p>
    </div>
  );
};

/**
 * A table row under a subject result row with a "Question-wise marks" toggle; renders nothing when the paper has
 * no questions. `colSpan` = the table's column count.
 */
export const QuestionBreakdownRow = ({ subject, colSpan }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!hasQuestionBreakdown(subject)) return null;
  return (
    <tr className="bg-slate-50/40">
      <td colSpan={colSpan} className="px-4 sm:px-6 pb-3 pt-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#EA580C] hover:text-[#c2410c] cursor-pointer py-1"
        >
          <ListOrdered className="w-3.5 h-3.5" />
          {t('marks.questionWise')} ({subject.questions.length})
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {open && (
          <div className="mt-2">
            <QuestionBreakdown subject={subject} />
          </div>
        )}
      </td>
    </tr>
  );
};

export default QuestionBreakdown;
