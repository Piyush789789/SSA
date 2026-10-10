import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatCurrency,
  formatDate,
  formatDateTime,
  initialsOf,
  parseIsoDate,
  toIsoDate,
  todayIso,
  weekdayName,
} from './index';

describe('formatDate', () => {
  it('formats ISO dates without a timezone shift', () => {
    expect(formatDate('2026-10-10')).toBe('10 Oct 2026');
    expect(formatDate('2026-01-01')).toBe('1 Jan 2026');
    expect(formatDate('2026-12-31')).toBe('31 Dec 2026');
  });

  it('accepts date-times and Date objects', () => {
    expect(formatDate('2026-03-05T23:59:59')).toBe('5 Mar 2026');
    expect(formatDate(new Date(2026, 1, 28))).toBe('28 Feb 2026');
  });

  it('shows a dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('shows a dash instead of "NaN undefined NaN" for unparseable input', () => {
    expect(formatDate('not a date')).toBe('—');
    expect(formatDate('2026-13-01')).toBe('—');
    expect(formatDate(new Date('invalid'))).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('formats morning, noon, afternoon and midnight', () => {
    expect(formatDateTime('2026-10-06T10:30:00')).toBe('6 Oct 2026, 10:30 AM');
    expect(formatDateTime('2026-10-06T12:05:00')).toBe('6 Oct 2026, 12:05 PM');
    expect(formatDateTime('2026-10-06T15:00')).toBe('6 Oct 2026, 3:00 PM');
    expect(formatDateTime('2026-10-06T00:00:00')).toBe('6 Oct 2026, 12:00 AM');
  });

  it('falls back to the date when there is no time', () => {
    expect(formatDateTime('2026-10-06')).toBe('6 Oct 2026');
    expect(formatDateTime(null)).toBe('—');
  });

  it('handles fractional seconds and missing minutes', () => {
    expect(formatDateTime('2026-10-06T09:07:00.123456')).toBe('6 Oct 2026, 9:07 AM');
    expect(formatDateTime('2026-10-06T09')).toBe('6 Oct 2026, 9:00 AM');
  });
});

describe('ISO date helpers', () => {
  it('parseIsoDate gives local midnight of that day', () => {
    const d = parseIsoDate('2026-10-10');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 10, 0]);
  });

  it('toIsoDate pads month and day', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('addDays crosses month, year and leap-day boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-10', 0)).toBe('2026-10-10');
    expect(addDays('2026-10-10', -30)).toBe('2026-09-10');
  });

  it('weekdayName', () => {
    expect(weekdayName('2026-10-10')).toBe('Saturday');
    expect(weekdayName('2026-10-11')).toBe('Sunday');
  });
});

describe('formatCurrency', () => {
  it('uses Indian digit grouping', () => {
    expect(formatCurrency(12500)).toBe('₹12,500');
    expect(formatCurrency(1234567)).toBe('₹12,34,567');
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency('2500')).toBe('₹2,500');
  });

  it('treats missing amounts as zero', () => {
    expect(formatCurrency(null)).toBe('₹0');
    expect(formatCurrency(undefined)).toBe('₹0');
  });

  it('never prints ₹NaN', () => {
    expect(formatCurrency('abc')).toBe('₹0');
  });

  it('keeps paise and negatives', () => {
    expect(formatCurrency(99.5)).toBe('₹99.5');
    expect(formatCurrency(-500)).toBe('-₹500');
  });
});

describe('initialsOf', () => {
  it('takes up to two initials', () => {
    expect(initialsOf('Rohit Verma')).toBe('RV');
    expect(initialsOf('rohit kumar verma')).toBe('RK');
    expect(initialsOf('  Asha  ')).toBe('A');
    expect(initialsOf('')).toBe('');
    expect(initialsOf()).toBe('');
  });

  it('does not crash on null names from the server', () => {
    expect(initialsOf(null)).toBe('');
  });
});
