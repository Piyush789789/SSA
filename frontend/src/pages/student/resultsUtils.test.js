import { describe, expect, it } from 'vitest';
import { aggregateBySubject, bandFor, gradeFor, groupByExam, percentOf } from './resultsUtils';
import { gradeFor as examGradeFor } from '@/components/exams/grading';

const BANDS = [
  { min: 91, max: 100, grade: 'A1' },
  { min: 81, max: 90, grade: 'A2' },
  { min: 33, max: 80, grade: 'C' },
  { min: 0, max: 32, grade: 'E' },
];

describe('percentOf', () => {
  it('rounds to one decimal and guards against zero', () => {
    expect(percentOf(45, 50)).toBe(90);
    expect(percentOf(2, 3)).toBe(66.7);
    expect(percentOf(0, 50)).toBe(0);
    expect(percentOf(10, 0)).toBeNull();
    expect(percentOf(10, null)).toBeNull();
  });
});

describe('grade bands (results and exams)', () => {
  it.each([
    [100, 'A1'],
    [90.5, 'A1'], // rounds to 91
    [90.4, 'A2'],
    [81, 'A2'],
    [80.6, 'A2'],
    [33, 'C'],
    [32.4, 'E'],
    [0, 'E'],
  ])('%s%% -> %s', (pct, grade) => {
    expect(gradeFor(pct, BANDS)).toBe(grade);
    expect(examGradeFor(pct, BANDS)).toBe(grade);
  });

  it('no grade without a percentage or bands', () => {
    expect(gradeFor(null, BANDS)).toBeNull();
    expect(gradeFor(50, undefined)).toBeNull();
    expect(bandFor(150, BANDS)).toBeNull();
    expect(examGradeFor(null, BANDS)).toBe('—');
    expect(examGradeFor(50)).toBe('—');
  });
});

const result = (o) => ({ examId: 'E1', examName: 'Half Yearly', subject: 'Maths', maxMarks: 100, obtainedMarks: 80, passed: true, ...o });

describe('groupByExam', () => {
  it('groups, totals and sorts newest exam first', () => {
    const groups = groupByExam([
      result({ subject: 'Maths', date: '2026-09-10', obtainedMarks: 90, percentage: 90 }),
      result({ subject: 'Hindi', date: '2026-09-12', obtainedMarks: 60, percentage: 60 }),
      result({ examId: 'E2', examName: 'Unit Test', subject: 'Maths', maxMarks: 25, obtainedMarks: 5, passed: false, date: '2026-10-01' }),
    ]);
    expect(groups.map((g) => g.examId)).toEqual(['E2', 'E1']);
    expect(groups[1]).toMatchObject({
      examName: 'Half Yearly',
      startDate: '2026-09-10',
      endDate: '2026-09-12',
      totalMax: 200,
      totalObtained: 150,
      percentage: 75,
      passedAll: true,
    });
    expect(groups[0].passedAll).toBe(false);
  });

  it('absent / not entered marks count as 0 and missing dates sort last', () => {
    const groups = groupByExam([
      result({ examId: 'A', obtainedMarks: null, date: null }),
      result({ examId: 'B', date: '2026-01-01' }),
    ]);
    expect(groups.map((g) => g.examId)).toEqual(['B', 'A']);
    expect(groups[1]).toMatchObject({ totalObtained: 0, startDate: null, endDate: null, percentage: 0 });
  });

  it('empty', () => {
    expect(groupByExam()).toEqual([]);
  });
});

describe('aggregateBySubject', () => {
  it('aggregates per subject sorted by name, results in date order', () => {
    const subjects = aggregateBySubject([
      result({ subject: 'Maths', date: '2026-10-01', maxMarks: 50, obtainedMarks: 40, percentage: 80 }),
      result({ subject: 'Maths', date: '2026-09-01', maxMarks: 50, obtainedMarks: 45, percentage: 90 }),
      result({ subject: 'English', date: '2026-09-01', maxMarks: 100, obtainedMarks: null, percentage: null }),
    ]);
    expect(subjects.map((s) => s.subject)).toEqual(['English', 'Maths']);
    expect(subjects[1]).toMatchObject({ count: 2, totalMax: 100, totalObtained: 85, avgPct: 85, highestPct: 90 });
    expect(subjects[1].results.map((r) => r.date)).toEqual(['2026-09-01', '2026-10-01']);
    expect(subjects[0]).toMatchObject({ avgPct: 0, highestPct: 0 });
  });
});
