/**
 * Helpers shared by the student Exams, Report Card and Progress pages. They only reshape what
 * GET /results/students/{id} returns; grades come from the /meta gradeBands.
 */

/** Percentage rounded to one decimal, or null when there is nothing to divide by. */
export const percentOf = (obtained, max) => (max > 0 ? Math.round((obtained * 1000) / max) / 10 : null);

/** The /meta grade band containing `percentage` (rounded like the backend does). */
export const bandFor = (percentage, gradeBands) => {
  if (percentage == null || !Array.isArray(gradeBands)) return null;
  const rounded = Math.round(percentage);
  return gradeBands.find((band) => rounded >= band.min && rounded <= band.max) || null;
};

export const gradeFor = (percentage, gradeBands) => bandFor(percentage, gradeBands)?.grade ?? null;

/**
 * Groups subject results by exam, newest exam first:
 * [{ examId, examName, startDate, endDate, subjects, totalMax, totalObtained, percentage, passedAll }]
 */
export const groupByExam = (subjects = []) => {
  const groups = new Map();
  subjects.forEach((s) => {
    if (!groups.has(s.examId)) {
      groups.set(s.examId, { examId: s.examId, examName: s.examName, subjects: [] });
    }
    groups.get(s.examId).subjects.push(s);
  });

  return [...groups.values()]
    .map((g) => {
      const dates = g.subjects.map((s) => s.date).filter(Boolean).sort();
      const totalMax = g.subjects.reduce((sum, s) => sum + (s.maxMarks || 0), 0);
      const totalObtained = g.subjects.reduce((sum, s) => sum + (s.obtainedMarks ?? 0), 0);
      return {
        ...g,
        startDate: dates[0] ?? null,
        endDate: dates[dates.length - 1] ?? null,
        totalMax,
        totalObtained,
        percentage: percentOf(totalObtained, totalMax),
        passedAll: g.subjects.every((s) => s.passed),
      };
    })
    .sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
};

/** Per-subject aggregates over all results: [{ subject, count, totalMax, totalObtained, avgPct, highestPct, results }] */
export const aggregateBySubject = (subjects = []) => {
  const map = new Map();
  subjects.forEach((s) => {
    if (!map.has(s.subject)) map.set(s.subject, { subject: s.subject, results: [] });
    map.get(s.subject).results.push(s);
  });
  return [...map.values()]
    .map((item) => {
      const sorted = [...item.results].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const totalMax = sorted.reduce((sum, r) => sum + (r.maxMarks || 0), 0);
      const totalObtained = sorted.reduce((sum, r) => sum + (r.obtainedMarks ?? 0), 0);
      const pcts = sorted.map((r) => r.percentage ?? 0);
      return {
        subject: item.subject,
        results: sorted,
        count: sorted.length,
        totalMax,
        totalObtained,
        avgPct: percentOf(totalObtained, totalMax),
        highestPct: pcts.length ? Math.max(...pcts) : null,
      };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
};
