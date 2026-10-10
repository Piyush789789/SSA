import { describe, expect, it } from 'vitest';
import { ATTENDED, formatRate, groupBy, rateTone, summarizeRecords } from './attendanceMath';

describe('summarizeRecords', () => {
  it('counts statuses; late counts as attended, holidays are not working days', () => {
    const records = [
      { status: 'present' },
      { status: 'present' },
      { status: 'late' },
      { status: 'absent' },
      { status: 'leave' },
      { status: 'holiday' },
      { status: 'holiday' },
    ];
    expect(summarizeRecords(records)).toEqual({
      present: 2,
      absent: 1,
      late: 1,
      leave: 1,
      holiday: 2,
      workingDays: 5,
      rate: 60,
    });
  });

  it('rounds the rate to one decimal', () => {
    const records = [{ status: 'present' }, { status: 'present' }, { status: 'absent' }];
    expect(summarizeRecords(records).rate).toBe(66.7);
  });

  it('gives null rate without working days', () => {
    expect(summarizeRecords([]).rate).toBeNull();
    expect(summarizeRecords().rate).toBeNull();
    expect(summarizeRecords([{ status: 'holiday' }]).rate).toBeNull();
  });

  it('ignores unknown statuses', () => {
    expect(summarizeRecords([{ status: 'PRESENT' }, { status: undefined }, { status: 'present' }])).toMatchObject({
      present: 1,
      workingDays: 1,
      rate: 100,
    });
  });

  it('ATTENDED set', () => {
    expect([...ATTENDED].sort()).toEqual(['late', 'present']);
  });
});

describe('groupBy', () => {
  it('groups preserving order', () => {
    const map = groupBy(
      [
        { s: 'a', n: 1 },
        { s: 'b', n: 2 },
        { s: 'a', n: 3 },
      ],
      (x) => x.s,
    );
    expect([...map.keys()]).toEqual(['a', 'b']);
    expect(map.get('a').map((x) => x.n)).toEqual([1, 3]);
    expect(groupBy(undefined, (x) => x).size).toBe(0);
  });
});

describe('formatRate / rateTone', () => {
  it('formats', () => {
    expect(formatRate(92.456)).toBe('92.5%');
    expect(formatRate(0)).toBe('0.0%');
    expect(formatRate(100)).toBe('100.0%');
    expect(formatRate(null)).toBe('—');
    expect(formatRate(undefined)).toBe('—');
  });

  it('tones with the default and a custom threshold', () => {
    expect(rateTone(null)).toBe('none');
    expect(rateTone(90)).toBe('good');
    expect(rateTone(89.9)).toBe('ok');
    expect(rateTone(75)).toBe('ok');
    expect(rateTone(74.9)).toBe('low');
    expect(rateTone(0)).toBe('low');
    expect(rateTone(80, 85)).toBe('low');
    expect(rateTone(85, 85)).toBe('ok');
  });
});
