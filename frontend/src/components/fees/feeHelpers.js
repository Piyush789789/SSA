/** Helpers that turn GET /fees/dues rows into per-student / per-class figures. */

/** Net amount billed on a due after its concession. */
export const netAmount = (due) => (due.amount || 0) - (due.concession || 0);

export const statusBadgeClass = (status) =>
  status === 'Paid'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : status === 'Partial'
    ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : status === 'Overdue'
    ? 'bg-rose-50 text-rose-700 border border-rose-200'
    : 'bg-orange-50 text-orange-700 border border-orange-200';

/**
 * Groups dues by student: [{ id, name, className, totalDue, concession, paid, pending, status, oldestDueDate }],
 * sorted by class then name. Status: Paid (nothing pending), Overdue (any overdue due), Partial (something
 * paid), otherwise Pending.
 */
export const groupDuesByStudent = (dues = []) => {
  const byStudent = new Map();
  dues.forEach((d) => {
    const entry = byStudent.get(d.studentId) || {
      id: d.studentId,
      name: d.studentName,
      className: d.className,
      totalDue: 0,
      concession: 0,
      paid: 0,
      pending: 0,
      anyOverdue: false,
      oldestDueDate: null,
    };
    entry.totalDue += netAmount(d);
    entry.concession += d.concession || 0;
    entry.paid += d.paid || 0;
    entry.pending += d.pending || 0;
    if (d.status === 'Overdue') entry.anyOverdue = true;
    if (d.pending > 0 && d.dueDate && (!entry.oldestDueDate || d.dueDate < entry.oldestDueDate)) {
      entry.oldestDueDate = d.dueDate;
    }
    byStudent.set(d.studentId, entry);
  });

  return [...byStudent.values()]
    .map(({ anyOverdue, ...s }) => ({
      ...s,
      status: s.pending <= 0 ? 'Paid' : anyOverdue ? 'Overdue' : s.paid > 0 ? 'Partial' : 'Pending',
    }))
    .sort(
      (a, b) =>
        String(a.className ?? '').localeCompare(String(b.className ?? ''), undefined, { numeric: true }) ||
        String(a.name ?? '').localeCompare(String(b.name ?? '')),
    );
};

/** "2026-10-06T10:30:00" -> "2026-10-06" */
export const paymentDate = (payment) => String(payment.paidAt || '').slice(0, 10);
