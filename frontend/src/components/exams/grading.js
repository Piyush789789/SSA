const NONE = [];

/** Grade for a percentage using the /meta gradeBands ([{min, max, grade}]). */
export const gradeFor = (percent, gradeBands = NONE) => {
  if (percent == null) return '—';
  const rounded = Math.round(percent);
  const band = gradeBands.find((b) => rounded >= b.min && rounded <= b.max);
  return band ? band.grade : '—';
};
