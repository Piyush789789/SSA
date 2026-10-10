import { parseIsoDate } from '@/utils';

/** "YYYY-MM" of the month `offset` months before the month of `today` ("YYYY-MM-DD"). */
export const monthKey = (today, offset) => {
  const date = parseIsoDate(today);
  date.setDate(1);
  date.setMonth(date.getMonth() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/** First day ("YYYY-MM-01") of the oldest month in the fee chart — used to load payments. */
export const feeChartStart = (today, months = 6) => `${monthKey(today, months - 1)}-01`;
