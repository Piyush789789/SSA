/**
 * Pure helpers for question-wise marks (a paper split into questions such as Q1 = 5, Q2 = 10 …).
 * A paper's `questions` is `[{label, maxMarks}]`; their maxMarks must add up exactly to the paper's maxMarks,
 * half marks are allowed, labels are unique and there are at most 50 questions (the server checks the same).
 * A student's `questionMarks` is an array in question order: a number, or null for "not attempted".
 */

export const MAX_QUESTIONS = 50;

const NONE = [];

/** Rounds to the nearest half mark (and removes float noise such as 2.4999999). */
export const roundHalf = (n) => Math.round(Number(n) * 2) / 2;

/** Adds numbers without float noise (0.1 + 0.2 style); marks only use halves, so two decimals is plenty. */
const cleanSum = (values) => Math.round(values.reduce((sum, v) => sum + v, 0) * 100) / 100;

/** Sum of the questions' max marks. */
export const sumQuestionMax = (questions = NONE) =>
  cleanSum(questions.map((q) => Number(q.maxMarks)).filter((n) => Number.isFinite(n)));

/** Number for a typed cell ('' / null / undefined → null, anything not numeric → NaN). */
export const cellNumber = (value) => {
  if (value === '' || value == null) return null;
  if (typeof value === 'number') return value;
  const text = String(value).trim();
  if (text === '') return null;
  return /^-?\d+(\.\d+)?$|^-?\.\d+$/.test(text) ? Number(text) : NaN;
};

/** True when `n` is a whole or half number. */
export const isHalfStep = (n) => Number.isInteger(n * 2);

/**
 * Splits `total` marks into `count` questions Q1..Qn as equally as possible in half marks. The remainder goes to
 * the first questions, so 10 into 3 gives 3.5, 3.5, 3.
 */
export const splitEqually = (total, count) => {
  const n = Math.floor(Number(count));
  const max = Number(total);
  if (!(n >= 1) || !(max > 0)) return [];
  const halves = Math.round(max * 2);
  const base = Math.floor(halves / n);
  const extra = halves - base * n;
  return Array.from({ length: n }, (_, i) => ({ label: `Q${i + 1}`, maxMarks: (base + (i < extra ? 1 : 0)) / 2 }));
};

/** The next free "Qn" label for a new row. */
export const nextQuestionLabel = (questions = NONE) => {
  const used = new Set(questions.map((q) => String(q.label ?? '').trim().toLowerCase()));
  let i = questions.length + 1;
  while (used.has(`q${i}`)) i += 1;
  return `Q${i}`;
};

/**
 * Checks an edited question list against the paper's max marks.
 * Returns `{ key, vars }` describing the first problem (an i18n key under `marks.`), or null when it is valid.
 * An empty list is valid (it removes the breakdown).
 */
export const validateQuestions = (questions = NONE, paperMax) => {
  if (questions.length === 0) return null;
  if (questions.length > MAX_QUESTIONS) return { key: 'marks.errTooMany', vars: { n: MAX_QUESTIONS } };
  const seen = new Set();
  for (let i = 0; i < questions.length; i += 1) {
    const label = String(questions[i].label ?? '').trim();
    if (!label) return { key: 'marks.errLabelRequired', vars: { n: i + 1 } };
    const lower = label.toLowerCase();
    if (seen.has(lower)) return { key: 'marks.errLabelDuplicate', vars: { label } };
    seen.add(lower);
    const max = cellNumber(questions[i].maxMarks);
    if (max == null || Number.isNaN(max) || max <= 0) return { key: 'marks.errQuestionMax', vars: { label } };
    if (!isHalfStep(max)) return { key: 'marks.errHalfMarks', vars: { label } };
  }
  const sum = sumQuestionMax(questions.map((q) => ({ maxMarks: cellNumber(q.maxMarks) })));
  if (sum !== Number(paperMax)) return { key: 'marks.errSum', vars: { sum, max: paperMax } };
  return null;
};

/** Payload for PUT /exam-schedules/{id}/questions from edited rows (labels trimmed, max marks as numbers). */
export const toQuestionsPayload = (questions = NONE) =>
  questions.map((q) => ({ label: String(q.label).trim(), maxMarks: cellNumber(q.maxMarks) }));

/**
 * Error for one question cell typed by the user, or null when it is fine. Blank = not attempted = fine.
 * Returns `{ key, vars }` (an i18n key under `marks.`).
 */
export const validateQuestionCell = (value, max) => {
  const n = cellNumber(value);
  if (n == null) return null;
  if (Number.isNaN(n)) return { key: 'marks.errNumber', vars: {} };
  if (n < 0 || n > Number(max)) return { key: 'marks.errRange', vars: { max } };
  return null;
};

/** Sum of the attempted questions, or null when no question has a mark. Invalid cells are ignored. */
export const totalOfCells = (cells = NONE) => {
  const numbers = cells.map(cellNumber).filter((n) => n != null && !Number.isNaN(n));
  return numbers.length === 0 ? null : cleanSum(numbers);
};

/** True when any cell of the row is invalid for its question. */
export const rowHasCellErrors = (cells = NONE, questions = NONE) =>
  questions.some((q, i) => validateQuestionCell(cells[i], q.maxMarks) != null);

/** Editable string cells for a saved row (null or missing → ''), always one per question. */
export const cellsFromSaved = (questionMarks, questions = NONE) =>
  questions.map((_, i) => {
    const v = Array.isArray(questionMarks) ? questionMarks[i] : null;
    return v == null ? '' : String(v);
  });

/**
 * One entry of PUT /exam-schedules/{id}/marks for a question-wise row.
 * `row` = `{ studentId, absent, cells, status, savedTotal, savedQuestionMarks, savedAbsent }`.
 * - absent → absent entry;
 * - any question has a mark → `questionMarks` (the server computes the total);
 * - nothing typed, but a total-only mark was saved before → that total is kept as it is;
 * - nothing typed → blank (cleared when something had been saved).
 */
export const buildQuestionEntry = (row) => {
  const base = { studentId: row.studentId };
  if (row.absent) return { ...base, obtainedMarks: null, absent: true, clear: false };
  const values = (row.cells ?? NONE).map(cellNumber);
  if (values.some((v) => v != null)) {
    return { ...base, absent: false, clear: false, questionMarks: values.map((v) => (v == null ? null : v)) };
  }
  if (row.savedQuestionMarks == null && row.savedTotal != null && !row.savedAbsent) {
    return { ...base, obtainedMarks: row.savedTotal, absent: false, clear: false };
  }
  return { ...base, obtainedMarks: null, absent: false, clear: row.status != null && row.status !== 'Not Entered' };
};

/**
 * How a question score should look for students/parents:
 * 'none' (not attempted), 'full' (full marks), 'weak' (< 40 %) or 'ok'.
 */
export const questionTone = (mark, max) => {
  if (mark == null) return 'none';
  if (!(max > 0)) return 'ok';
  if (mark >= max) return 'full';
  if (mark / max < 0.4) return 'weak';
  return 'ok';
};

/** Percentage 0..100 for a mini bar (null mark → 0). */
export const barPercent = (mark, max) => (mark == null || !(max > 0) ? 0 : Math.max(0, Math.min(100, (mark / max) * 100)));

/** Shows 3.5 as "3.5" and 3 as "3". */
export const fmtMark = (n) => (n == null ? '—' : String(Math.round(Number(n) * 100) / 100));

/** True when a SubjectResult (GET /results/students/{id}) has a question-wise breakdown. */
export const hasQuestionBreakdown = (subject) => Array.isArray(subject?.questions) && subject.questions.length > 0;
