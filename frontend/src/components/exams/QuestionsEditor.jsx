import React, { useState } from 'react';
import { ListOrdered, Plus, Trash2, Scissors, Save, X } from 'lucide-react';
import { http } from '@/api/http';
import { useI18n } from '@/i18n/translate';
import {
  MAX_QUESTIONS,
  cellNumber,
  fmtMark,
  nextQuestionLabel,
  splitEqually,
  sumQuestionMax,
  toQuestionsPayload,
  validateQuestions,
} from './questionMarks';

let rowKey = 0;
const withKeys = (questions) => questions.map((q) => ({ key: ++rowKey, label: q.label, maxMarks: String(q.maxMarks) }));

/**
 * "Questions" panel of a marks sheet: shows the paper's question-wise breakdown and lets the subject teacher (or an
 * admin) edit it — rows of label + max marks, a "split into N equal questions" helper and a live check that the
 * questions add up to the paper's max marks. Saves with PUT /exam-schedules/{id}/questions; an empty list removes it.
 * `onChanged(updatedPaper)` is awaited after a save so the page can reload the marks sheet.
 */
export const QuestionsEditor = ({ schedule, locked = false, hasUnsavedMarks = false, onChanged }) => {
  const { t } = useI18n();
  const questions = schedule?.questions ?? [];
  const paperMax = Number(schedule?.maxMarks ?? 0);

  const [draft, setDraft] = useState(null); // null = not editing
  const [splitCount, setSplitCount] = useState('');
  const [busy, setBusy] = useState(null); // 'save' | 'remove'
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const editing = draft != null;

  const startEditing = () => {
    setDraft(withKeys(questions.length > 0 ? questions : splitEqually(paperMax, 5)));
    setSplitCount(String(questions.length || 5));
    setError('');
    setConfirmRemove(false);
  };

  const cancel = () => {
    setDraft(null);
    setError('');
    setConfirmRemove(false);
  };

  const updateRow = (key, field, value) =>
    setDraft((prev) => prev.map((q) => (q.key === key ? { ...q, [field]: value } : q)));

  const addRow = () =>
    setDraft((prev) => [...prev, { key: ++rowKey, label: nextQuestionLabel(prev), maxMarks: '' }]);

  const removeRow = (key) => setDraft((prev) => prev.filter((q) => q.key !== key));

  const applySplit = () => {
    const n = Number(splitCount);
    if (!Number.isInteger(n) || n < 1 || n > MAX_QUESTIONS) {
      setError(t('marks.errSplitCount', { n: MAX_QUESTIONS }));
      return;
    }
    setError('');
    setDraft(withKeys(splitEqually(paperMax, n)));
  };

  const send = async (list, kind) => {
    setBusy(kind);
    setError('');
    try {
      const updated = await http.put(`/exam-schedules/${encodeURIComponent(schedule.id)}/questions`, {
        questions: toQuestionsPayload(list),
      });
      await onChanged?.(updated);
      setDraft(null);
      setConfirmRemove(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const draftSum = editing ? sumQuestionMax(draft.map((q) => ({ maxMarks: cellNumber(q.maxMarks) }))) : 0;
  const problem = editing ? validateQuestions(draft, paperMax) : null;
  const sumMatches = editing && draftSum === paperMax;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4" aria-label={t('marks.questions')}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
            <ListOrdered className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{t('marks.questions')}</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {questions.length > 0
                ? t('marks.questionsSummary', { n: questions.length, max: fmtMark(paperMax) })
                : t('marks.noQuestions')}
            </p>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            disabled={locked || !schedule}
            className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {questions.length > 0 ? t('marks.editQuestions') : t('marks.setUpQuestions')}
          </button>
        )}
      </div>

      {!editing && questions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q) => (
            <span key={q.label} className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">
              {q.label} <span className="text-slate-400 font-semibold">· {fmtMark(q.maxMarks)}</span>
            </span>
          ))}
        </div>
      )}

      {!editing && error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      {editing && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <label className="text-[11px] font-bold text-slate-600">
              {t('marks.splitLabel')}
              <input
                type="number"
                min="1"
                max={MAX_QUESTIONS}
                value={splitCount}
                onChange={(e) => setSplitCount(e.target.value)}
                className="block mt-1 w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
              />
            </label>
            <button
              type="button"
              onClick={applySplit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" />
              {t('marks.splitButton', { max: fmtMark(paperMax) })}
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
              <span>{t('marks.questionLabel')}</span>
              <span>{t('marks.questionMax')}</span>
              <span className="w-8" />
            </div>
            {draft.map((q, i) => (
              <div key={q.key} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input
                  type="text"
                  value={q.label}
                  maxLength={20}
                  onChange={(e) => updateRow(q.key, 'label', e.target.value)}
                  aria-label={t('marks.questionLabelN', { n: i + 1 })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={q.maxMarks}
                  onChange={(e) => updateRow(q.key, 'maxMarks', e.target.value)}
                  aria-label={t('marks.questionMaxN', { n: i + 1 })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
                <button
                  type="button"
                  onClick={() => removeRow(q.key)}
                  title={t('marks.removeQuestion')}
                  aria-label={t('marks.removeQuestion')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRow}
              disabled={draft.length >= MAX_QUESTIONS}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FF6B2C] hover:bg-orange-50 rounded-lg cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('marks.addQuestion')}
            </button>
          </div>

          <div
            role="status"
            className={`px-3 py-2 rounded-xl text-xs font-bold border ${
              sumMatches ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {t('marks.addsUpTo', { sum: fmtMark(draftSum), max: fmtMark(paperMax) })}
            {!sumMatches && draft.length > 0 && (
              <span className="font-semibold">
                {' '}
                ·{' '}
                {draftSum < paperMax
                  ? t('marks.sumShort', { n: fmtMark(paperMax - draftSum) })
                  : t('marks.sumOver', { n: fmtMark(draftSum - paperMax) })}
              </span>
            )}
          </div>

          {problem && !(problem.key === 'marks.errSum') && (
            <p className="text-xs font-semibold text-amber-700">{t(problem.key, problem.vars)}</p>
          )}
          {hasUnsavedMarks && <p className="text-xs font-semibold text-amber-700">{t('marks.unsavedWillReset')}</p>}
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div>
              {questions.length > 0 &&
                (confirmRemove ? (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    {t('marks.removeConfirm')}
                    <button
                      type="button"
                      onClick={() => send([], 'remove')}
                      disabled={busy != null}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      {busy === 'remove' ? t('marks.removing') : t('marks.yesRemove')}
                    </button>
                    <button type="button" onClick={() => setConfirmRemove(false)} className="px-2 py-1.5 font-bold text-slate-500 cursor-pointer">
                      {t('marks.no')}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    disabled={busy != null}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('marks.removeBreakdown')}
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancel}
                disabled={busy != null}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                {t('marks.cancel')}
              </button>
              <button
                type="button"
                onClick={() => send(draft, 'save')}
                disabled={busy != null || problem != null || draft.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-xl text-xs shadow-md shadow-[#FF6B2C]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                {busy === 'save' ? t('marks.saving') : t('marks.saveQuestions')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default QuestionsEditor;
