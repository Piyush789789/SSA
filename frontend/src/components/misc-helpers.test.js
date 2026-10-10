import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { daysBetween, daysLate, isOverdue, useDebounced } from './library/libraryUtils';
import { feeChartStart, monthKey } from './dashboard/dashboardDates';
import { formatTime } from './transport/time';
import { TIMETABLE_DAYS, subjectColors } from './timetable/subjectColors';
import { PERMISSION_GROUPS, SERVER_TEACHER_RULES } from './roles/permissionGroups';
import { STAFF_STATUSES, STAFF_STATUS_LABELS, STAFF_STATUS_STYLES } from './staff/staffStatus';
import { CERTIFICATE_TITLES, CONDUCT_OPTIONS } from './common/certificates';
import { addDays, todayIso } from '@/utils';

describe('library dates', () => {
  it('daysBetween', () => {
    expect(daysBetween('2026-10-01', '2026-10-11')).toBe(10);
    expect(daysBetween('2026-10-11', '2026-10-01')).toBe(-10);
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween(null, '2026-10-01')).toBe(0);
  });

  it('daysLate and isOverdue for open and returned loans', () => {
    const today = todayIso();
    expect(daysLate({ dueOn: addDays(today, -3) })).toBe(3);
    expect(isOverdue({ dueOn: addDays(today, -3) })).toBe(true);
    expect(daysLate({ dueOn: addDays(today, 2) })).toBe(0);
    expect(isOverdue({ dueOn: today })).toBe(false);
    expect(daysLate({ dueOn: '2026-10-01', returnedOn: '2026-10-05' })).toBe(4);
    expect(isOverdue({ dueOn: '2026-10-01', returnedOn: '2026-10-05' })).toBe(false);
    expect(daysLate({ dueOn: '2026-10-05', returnedOn: '2026-10-01' })).toBe(0);
    expect(daysLate(null)).toBe(0);
    expect(isOverdue(undefined)).toBe(false);
  });

  describe('useDebounced', () => {
    afterEach(() => vi.useRealTimers());
    it('updates after the delay', () => {
      vi.useFakeTimers();
      const { result, rerender } = renderHook(({ v }) => useDebounced(v, 300), { initialProps: { v: 'a' } });
      rerender({ v: 'ab' });
      expect(result.current).toBe('a');
      act(() => vi.advanceTimersByTime(299));
      expect(result.current).toBe('a');
      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toBe('ab');
    });
  });
});

describe('dashboard dates', () => {
  it('monthKey goes back months across years, also from the 31st', () => {
    expect(monthKey('2026-10-10', 0)).toBe('2026-10');
    expect(monthKey('2026-10-10', 5)).toBe('2026-05');
    expect(monthKey('2026-02-15', 3)).toBe('2025-11');
    expect(monthKey('2026-03-31', 1)).toBe('2026-02');
    expect(monthKey('2026-12-31', 12)).toBe('2025-12');
  });

  it('feeChartStart is the first day of the oldest month', () => {
    expect(feeChartStart('2026-10-10')).toBe('2026-05-01');
    expect(feeChartStart('2026-01-31', 3)).toBe('2025-11-01');
  });
});

describe('formatTime', () => {
  it.each([
    ['08:05', '8:05 AM'],
    ['00:00', '12:00 AM'],
    ['12:30', '12:30 PM'],
    ['13:45', '1:45 PM'],
    ['23:59:00', '11:59 PM'],
    ['7', '7:00 AM'],
  ])('%s -> %s', (input, out) => {
    expect(formatTime(input)).toBe(out);
  });

  it('passes through junk and shows a dash for nothing', () => {
    expect(formatTime(null)).toBe('—');
    expect(formatTime('')).toBe('—');
    expect(formatTime('soon')).toBe('soon');
  });
});

describe('subjectColors', () => {
  it('is stable per subject and always returns a palette entry', () => {
    expect(subjectColors('Maths')).toBe(subjectColors('Maths'));
    expect(subjectColors('')).toHaveProperty('badgeClass');
    expect(subjectColors()).toHaveProperty('colorBg');
    expect(subjectColors('A very long subject name with many characters to overflow the hash')).toHaveProperty('colorText');
    expect(TIMETABLE_DAYS).toHaveLength(6);
  });
});

describe('static definitions', () => {
  it('every permission switch has a server default', () => {
    const ids = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(SERVER_TEACHER_RULES).sort()).toEqual([...ids].sort());
  });

  it('staff statuses have labels and styles', () => {
    STAFF_STATUSES.forEach((s) => {
      expect(STAFF_STATUS_LABELS[s]).toBeTruthy();
      expect(STAFF_STATUS_STYLES[s]).toBeTruthy();
    });
  });

  it('certificates', () => {
    expect(CERTIFICATE_TITLES.TC).toBe('Transfer Certificate');
    expect(CERTIFICATE_TITLES.BONAFIDE).toBe('Bonafide Certificate');
    expect(CONDUCT_OPTIONS).toContain('Good');
  });
});
