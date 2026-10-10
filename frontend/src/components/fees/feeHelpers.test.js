import { describe, expect, it } from 'vitest';
import { groupDuesByStudent, netAmount, paymentDate, statusBadgeClass } from './feeHelpers';

const due = (o) => ({ amount: 1000, concession: 0, paid: 0, pending: 1000, status: 'Pending', ...o });

describe('netAmount', () => {
  it('subtracts the concession and treats missing values as 0', () => {
    expect(netAmount({ amount: 5000, concession: 500 })).toBe(4500);
    expect(netAmount({ amount: 5000 })).toBe(5000);
    expect(netAmount({})).toBe(0);
  });
});

describe('groupDuesByStudent', () => {
  it('sums dues per student and derives status', () => {
    const rows = groupDuesByStudent([
      due({ studentId: 'S1', studentName: 'Asha', className: '5-B', amount: 5000, concession: 500, paid: 1000, pending: 3500, dueDate: '2026-10-15' }),
      due({ studentId: 'S1', studentName: 'Asha', className: '5-B', amount: 1000, paid: 0, pending: 1000, dueDate: '2026-09-01', status: 'Overdue' }),
      due({ studentId: 'S2', studentName: 'Bina', className: '5-B', paid: 1000, pending: 0, status: 'Paid', dueDate: '2026-01-01' }),
      due({ studentId: 'S3', studentName: 'Chetan', className: '10-A', paid: 400, pending: 600, status: 'Partial', dueDate: '2026-11-01' }),
      due({ studentId: 'S4', studentName: 'Dev', className: '2-A', dueDate: '2026-12-01' }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(['S4', 'S1', 'S2', 'S3']); // classes sorted numerically: 2, 5, 10
    const asha = rows.find((r) => r.id === 'S1');
    expect(asha).toEqual({
      id: 'S1',
      name: 'Asha',
      className: '5-B',
      totalDue: 5500,
      concession: 500,
      paid: 1000,
      pending: 4500,
      status: 'Overdue',
      oldestDueDate: '2026-09-01',
    });
    expect(rows.find((r) => r.id === 'S2')).toMatchObject({ status: 'Paid', oldestDueDate: null });
    expect(rows.find((r) => r.id === 'S3').status).toBe('Partial');
    expect(rows.find((r) => r.id === 'S4').status).toBe('Pending');
  });

  it('sorts by name within a class', () => {
    const rows = groupDuesByStudent([
      due({ studentId: 'b', studentName: 'Zoya', className: '1-A' }),
      due({ studentId: 'a', studentName: 'Aman', className: '1-A' }),
    ]);
    expect(rows.map((r) => r.name)).toEqual(['Aman', 'Zoya']);
  });

  it('does not crash on students without a class or name', () => {
    const rows = groupDuesByStudent([
      due({ studentId: 'x', studentName: null, className: null }),
      due({ studentId: 'y', studentName: 'Yash', className: '3-A' }),
      due({ studentId: 'z', studentName: undefined, className: '3-A' }),
    ]);
    expect(rows).toHaveLength(3);
  });

  it('handles no dues', () => {
    expect(groupDuesByStudent()).toEqual([]);
  });
});

describe('statusBadgeClass / paymentDate', () => {
  it('maps statuses', () => {
    expect(statusBadgeClass('Paid')).toContain('emerald');
    expect(statusBadgeClass('Partial')).toContain('amber');
    expect(statusBadgeClass('Overdue')).toContain('rose');
    expect(statusBadgeClass('Pending')).toContain('orange');
    expect(statusBadgeClass(undefined)).toContain('orange');
  });

  it('takes the date part', () => {
    expect(paymentDate({ paidAt: '2026-10-06T10:30:00' })).toBe('2026-10-06');
    expect(paymentDate({})).toBe('');
  });
});
