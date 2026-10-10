import { useEffect, useState } from 'react';
import { parseIsoDate, todayIso } from '@/utils';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from ISO date `from` to ISO date `to` (negative when `to` is earlier). */
export const daysBetween = (from, to) => {
  if (!from || !to) return 0;
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / DAY_MS);
};

/**
 * Days a loan is (or was) late: for an open loan, today − due date; for a returned one, returned − due date.
 * 0 when on time.
 */
export const daysLate = (issue) => {
  if (!issue?.dueOn) return 0;
  const end = issue.returnedOn || todayIso();
  return Math.max(0, daysBetween(issue.dueOn, end));
};

export const isOverdue = (issue) => !issue?.returnedOn && daysLate(issue) > 0;

/** `value`, updated only after it stopped changing for `delay` ms (for search boxes). */
export const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
