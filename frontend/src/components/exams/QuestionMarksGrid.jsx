import React, { useRef } from 'react';
import { useI18n } from '@/i18n/translate';
import { fmtMark, totalOfCells, validateQuestionCell } from './questionMarks';

const STATUS_STYLES = {
  Submitted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Draft: 'bg-amber-50 text-amber-700 border-amber-200',
  'Not Entered': 'bg-slate-100 text-slate-500 border-slate-200',
  Unsaved: 'bg-sky-50 text-sky-700 border-sky-200',
};

/**
 * Question-wise marks grid: one box per question (blank = not attempted), an automatic read-only Total and the
 * Absent checkbox. Enter / Shift+Enter move to the next / previous box, ArrowUp / ArrowDown move between students.
 *
 * `rows`: [{ studentId, studentName, rollNumber, status, absent, cells: [string], changed, savedTotal,
 * savedQuestionMarks }]. Cell values are validated (0..max) as they are typed; the page checks them again on save.
 */
export const QuestionMarksGrid = ({ questions, maxMarks, rows, locked = false, onCellChange, onAbsentChange, renderGrade }) => {
  const { t } = useI18n();
  const gridRef = useRef(null);

  const focusCell = (r, c) => {
    const el = gridRef.current?.querySelector(`[data-qcell="${r}-${c}"]`);
    if (el && !el.disabled) {
      el.focus();
      el.select?.();
      return true;
    }
    return false;
  };

  const moveAcross = (r, c, step) => {
    let row = r;
    let col = c;
    for (let guard = 0; guard < rows.length * questions.length; guard += 1) {
      col += step;
      if (col >= questions.length) {
        col = 0;
        row += 1;
      } else if (col < 0) {
        col = questions.length - 1;
        row -= 1;
      }
      if (row < 0 || row >= rows.length) return;
      if (focusCell(row, col)) return;
    }
  };

  const moveDown = (r, c, step) => {
    for (let row = r + step; row >= 0 && row < rows.length; row += step) {
      if (focusCell(row, c)) return;
    }
  };

  const onKeyDown = (e, r, c) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      moveAcross(r, c, e.shiftKey ? -1 : 1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      moveDown(r, c, e.key === 'ArrowDown' ? 1 : -1);
    }
  };

  return (
    <div className="overflow-x-auto" ref={gridRef}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">{t('marks.rollNo')}</th>
            <th className="py-3 px-3">{t('marks.student')}</th>
            {questions.map((q) => (
              <th key={q.label} className="py-3 px-1 text-center whitespace-nowrap">
                {q.label}
                <span className="block text-[9px] text-slate-400 font-semibold normal-case">/{fmtMark(q.maxMarks)}</span>
              </th>
            ))}
            <th className="py-3 px-3 text-center">
              {t('marks.total')}
              <span className="block text-[9px] text-slate-400 font-semibold normal-case">/{fmtMark(maxMarks)}</span>
            </th>
            <th className="py-3 px-3 text-center">{t('marks.absent')}</th>
            <th className="py-3 px-3 text-center">{t('marks.status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, r) => {
            const errors = questions.map((q, c) => (row.absent ? null : validateQuestionCell(row.cells[c], q.maxMarks)));
            const firstError = errors.findIndex(Boolean);
            const typedTotal = row.absent ? null : totalOfCells(row.cells);
            const totalOnly = !row.absent && typedTotal == null && row.savedQuestionMarks == null && row.savedTotal != null;
            const total = totalOnly ? row.savedTotal : typedTotal;
            const status = row.changed ? 'Unsaved' : row.status;
            return (
              <tr key={row.studentId} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3 font-bold text-slate-700">#{row.rollNumber}</td>
                <td className="py-2.5 px-3">
                  <span className="font-bold text-slate-900 block whitespace-nowrap">{row.studentName}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{row.studentId}</span>
                </td>
                {questions.map((q, c) => {
                  const err = errors[c];
                  return (
                    <td key={q.label} className="py-2 px-1 text-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        data-qcell={`${r}-${c}`}
                        disabled={row.absent || locked}
                        value={row.absent ? '' : row.cells[c] ?? ''}
                        onChange={(e) => onCellChange(row.studentId, c, e.target.value)}
                        onKeyDown={(e) => onKeyDown(e, r, c)}
                        aria-label={t('marks.cellLabel', { question: q.label, name: row.studentName })}
                        aria-invalid={err ? true : undefined}
                        title={err ? t(err.key, err.vars) : undefined}
                        placeholder="–"
                        className={`w-12 h-9 text-center bg-slate-50 border rounded-lg text-xs font-bold focus:outline-none ${
                          err
                            ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-2 focus:ring-rose-200'
                            : 'border-slate-200 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20'
                        } ${row.absent ? 'opacity-40 bg-slate-100 cursor-not-allowed' : ''}`}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center whitespace-nowrap">
                  {row.absent ? (
                    <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-[11px]">
                      AB
                    </span>
                  ) : (
                    <>
                      <span className="font-black text-slate-900 text-sm" aria-label={t('marks.total')}>
                        {total == null ? '—' : fmtMark(total)}
                      </span>
                      {total != null && renderGrade?.(total)}
                      {totalOnly && <span className="block text-[10px] font-semibold text-slate-400">{t('marks.totalOnlyShort')}</span>}
                      {firstError >= 0 && (
                        <span className="block text-[10px] font-bold text-rose-600" role="alert">
                          {questions[firstError].label}: {t(errors[firstError].key, errors[firstError].vars)}
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(row.absent)}
                    disabled={locked}
                    onChange={(e) => onAbsentChange(row.studentId, e.target.checked)}
                    aria-label={t('marks.absentFor', { name: row.studentName })}
                    className="w-4 h-4 rounded text-[#FF6B2C] focus:ring-[#FF6B2C] cursor-pointer"
                  />
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-lg border font-bold text-[10px] ${STATUS_STYLES[status] ?? STATUS_STYLES['Not Entered']}`}>
                    {status === 'Unsaved' ? t('marks.unsaved') : status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default QuestionMarksGrid;
