/**
 * Helpers for turning backend attendance records ({studentId, date, status, ...}) into counts and rates.
 * Same rules as the backend's /attendance/students/{id}/stats: holidays are not working days and
 * "late" counts as attended.
 */

export const ATTENDED = new Set(['present', 'late']);

/** Counts records by status and works out the attendance rate (null when there are no working days). */
export function summarizeRecords(records = []) {
  const counts = { present: 0, absent: 0, late: 0, leave: 0, holiday: 0 };
  records.forEach((record) => {
    if (counts[record.status] !== undefined) counts[record.status] += 1;
  });
  const workingDays = counts.present + counts.absent + counts.late + counts.leave;
  const rate = workingDays ? Math.round(((counts.present + counts.late) * 1000) / workingDays) / 10 : null;
  return { ...counts, workingDays, rate };
}

/** Groups a list into a Map by key. */
export function groupBy(list = [], keyOf) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyOf(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

/** 92.456 -> "92.5%", null -> "—" */
export const formatRate = (rate) => (rate === null || rate === undefined ? '—' : `${Number(rate).toFixed(1)}%`);

/** Colour tone for a rate: good >= 90, ok >= threshold (75), otherwise low. */
export const rateTone = (rate, threshold = 75) => {
  if (rate === null || rate === undefined) return 'none';
  if (rate >= 90) return 'good';
  if (rate >= threshold) return 'ok';
  return 'low';
};
