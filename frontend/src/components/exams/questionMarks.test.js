import { describe, expect, it } from 'vitest';
import {
  barPercent,
  buildQuestionEntry,
  cellNumber,
  cellsFromSaved,
  hasQuestionBreakdown,
  nextQuestionLabel,
  questionTone,
  rowHasCellErrors,
  splitEqually,
  sumQuestionMax,
  toQuestionsPayload,
  totalOfCells,
  validateQuestionCell,
  validateQuestions,
} from './questionMarks';

const Q = [
  { label: 'Q1', maxMarks: 5 },
  { label: 'Q2', maxMarks: 2.5 },
  { label: 'Q3', maxMarks: 2.5 },
];

describe('splitEqually', () => {
  it('splits evenly when it divides', () => {
    expect(splitEqually(20, 4)).toEqual([
      { label: 'Q1', maxMarks: 5 },
      { label: 'Q2', maxMarks: 5 },
      { label: 'Q3', maxMarks: 5 },
      { label: 'Q4', maxMarks: 5 },
    ]);
  });

  it('uses half marks and gives the remainder to the first questions, always adding up', () => {
    expect(splitEqually(10, 3).map((q) => q.maxMarks)).toEqual([3.5, 3.5, 3]);
    expect(splitEqually(10, 4).map((q) => q.maxMarks)).toEqual([2.5, 2.5, 2.5, 2.5]);
    for (const [max, n] of [[100, 7], [25, 6], [80, 50], [33, 9]]) {
      expect(sumQuestionMax(splitEqually(max, n))).toBe(max);
    }
  });

  it('returns nothing for a bad count or max', () => {
    expect(splitEqually(10, 0)).toEqual([]);
    expect(splitEqually(0, 3)).toEqual([]);
    expect(splitEqually(10, 'x')).toEqual([]);
  });
});

describe('validateQuestions', () => {
  it('accepts questions that add up exactly, and an empty list', () => {
    expect(validateQuestions(Q, 10)).toBeNull();
    expect(validateQuestions([{ label: 'Q1', maxMarks: '5' }, { label: 'Q2', maxMarks: '5' }], 10)).toBeNull();
    expect(validateQuestions([], 10)).toBeNull();
  });

  it('reports a wrong sum with the numbers', () => {
    expect(validateQuestions(Q, 20)).toEqual({ key: 'marks.errSum', vars: { sum: 10, max: 20 } });
  });

  it('rejects blank and duplicate labels (case-insensitive) and bad max marks', () => {
    expect(validateQuestions([{ label: ' ', maxMarks: 10 }], 10)?.key).toBe('marks.errLabelRequired');
    expect(validateQuestions([{ label: 'Q1', maxMarks: 5 }, { label: 'q1', maxMarks: 5 }], 10)?.key).toBe('marks.errLabelDuplicate');
    expect(validateQuestions([{ label: 'Q1', maxMarks: 0 }, { label: 'Q2', maxMarks: 10 }], 10)?.key).toBe('marks.errQuestionMax');
    expect(validateQuestions([{ label: 'Q1', maxMarks: 'abc' }], 10)?.key).toBe('marks.errQuestionMax');
    expect(validateQuestions([{ label: 'Q1', maxMarks: 3.25 }, { label: 'Q2', maxMarks: 6.75 }], 10)?.key).toBe('marks.errHalfMarks');
  });

  it('allows at most 50 questions', () => {
    expect(validateQuestions(splitEqually(100, 50), 100)).toBeNull();
    const many = Array.from({ length: 51 }, (_, i) => ({ label: `Q${i + 1}`, maxMarks: 1 }));
    expect(validateQuestions(many, 51)?.key).toBe('marks.errTooMany');
  });

  it('builds the PUT payload with trimmed labels and numbers', () => {
    expect(toQuestionsPayload([{ label: ' Q1 ', maxMarks: '2.5', key: 1 }])).toEqual([{ label: 'Q1', maxMarks: 2.5 }]);
  });

  it('suggests the next free label', () => {
    expect(nextQuestionLabel([])).toBe('Q1');
    expect(nextQuestionLabel([{ label: 'Q1' }, { label: 'Q3' }])).toBe('Q4');
    expect(nextQuestionLabel([{ label: 'Q2' }])).toBe('Q3');
  });
});

describe('question cells and totals', () => {
  it('parses cells: blank is null, text is NaN', () => {
    expect(cellNumber('')).toBeNull();
    expect(cellNumber('  ')).toBeNull();
    expect(cellNumber('2.5')).toBe(2.5);
    expect(cellNumber(3)).toBe(3);
    expect(cellNumber('2a')).toBeNaN();
  });

  it('validates each cell against its question max', () => {
    expect(validateQuestionCell('', 5)).toBeNull();
    expect(validateQuestionCell('5', 5)).toBeNull();
    expect(validateQuestionCell('0', 5)).toBeNull();
    expect(validateQuestionCell('5.5', 5)).toEqual({ key: 'marks.errRange', vars: { max: 5 } });
    expect(validateQuestionCell('-1', 5)?.key).toBe('marks.errRange');
    expect(validateQuestionCell('x', 5)?.key).toBe('marks.errNumber');
    expect(rowHasCellErrors(['5', '3', ''], Q)).toBe(true); // 3 > 2.5
    expect(rowHasCellErrors(['5', '2.5', ''], Q)).toBe(false);
  });

  it('adds attempted questions without float noise; nothing attempted is null', () => {
    expect(totalOfCells(['1.1', '2.2', ''])).toBe(3.3);
    expect(totalOfCells(['4', '', '2.5'])).toBe(6.5);
    expect(totalOfCells(['', ''])).toBeNull();
    expect(totalOfCells(['x', '2'])).toBe(2);
  });

  it('makes one editable cell per question from saved marks', () => {
    expect(cellsFromSaved([4, null, 2.5], Q)).toEqual(['4', '', '2.5']);
    expect(cellsFromSaved(null, Q)).toEqual(['', '', '']);
  });
});

describe('buildQuestionEntry', () => {
  const base = { studentId: 'S1', status: 'Not Entered', savedTotal: null, savedQuestionMarks: null, savedAbsent: false };

  it('sends questionMarks with null for not attempted', () => {
    expect(buildQuestionEntry({ ...base, absent: false, cells: ['4', '', '2'] })).toEqual({
      studentId: 'S1',
      absent: false,
      clear: false,
      questionMarks: [4, null, 2],
    });
  });

  it('sends an absent entry without marks', () => {
    expect(buildQuestionEntry({ ...base, absent: true, cells: ['', '', ''] })).toEqual({
      studentId: 'S1',
      obtainedMarks: null,
      absent: true,
      clear: false,
    });
  });

  it('keeps a saved total-only mark when no question was typed', () => {
    expect(buildQuestionEntry({ ...base, status: 'Draft', savedTotal: 7, absent: false, cells: ['', '', ''] })).toEqual({
      studentId: 'S1',
      obtainedMarks: 7,
      absent: false,
      clear: false,
    });
  });

  it('clears a row whose saved question marks were all emptied, and skips a never-entered blank row', () => {
    expect(
      buildQuestionEntry({ ...base, status: 'Draft', savedTotal: 6, savedQuestionMarks: [4, 2, null], absent: false, cells: ['', '', ''] }),
    ).toEqual({ studentId: 'S1', obtainedMarks: null, absent: false, clear: true });
    expect(buildQuestionEntry({ ...base, absent: false, cells: ['', '', ''] })).toEqual({
      studentId: 'S1',
      obtainedMarks: null,
      absent: false,
      clear: false,
    });
  });
});

describe('result display helpers', () => {
  it('classifies question scores', () => {
    expect(questionTone(null, 5)).toBe('none');
    expect(questionTone(5, 5)).toBe('full');
    expect(questionTone(1.5, 5)).toBe('weak'); // 30 %
    expect(questionTone(2, 5)).toBe('ok'); // exactly 40 %
    expect(questionTone(0, 5)).toBe('weak');
  });

  it('computes bar widths', () => {
    expect(barPercent(null, 5)).toBe(0);
    expect(barPercent(2.5, 5)).toBe(50);
    expect(barPercent(6, 5)).toBe(100);
  });

  it('detects results with a breakdown', () => {
    expect(hasQuestionBreakdown({ questions: Q })).toBe(true);
    expect(hasQuestionBreakdown({ questions: [] })).toBe(false);
    expect(hasQuestionBreakdown({})).toBe(false);
  });
});
