/**
 * Formatting helpers. Dates from the backend are "YYYY-MM-DD" (or "YYYY-MM-DDTHH:mm:ss") in the school's
 * local time, so they are parsed by hand: new Date('2026-10-10') would be UTC midnight and can show the
 * previous day.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "2026-10-10" -> "10 Oct 2026". Also accepts a Date. */
export const formatDate = (date) => {
  if (!date) return '—';
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return '—';
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  const [year, month, day] = String(date).slice(0, 10).split('-').map(Number);
  if (!year || !MONTHS[month - 1] || !day) return '—';
  return `${day} ${MONTHS[month - 1]} ${year}`;
};

/** "2026-10-06T10:30:00" -> "6 Oct 2026, 10:30 AM". A value without a time shows just the date. */
export const formatDateTime = (value) => {
  if (!value) return '—';
  const [date, time = ''] = String(value).split(/[T ]/);
  const [h, m = 0] = time.split(':').map((part) => (part === '' ? NaN : Number(part)));
  if (time === '' || Number.isNaN(h)) return formatDate(date);
  const minutes = Number.isNaN(m) ? 0 : m;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${formatDate(date)}, ${hour12}:${String(minutes).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

/** Local Date for a "YYYY-MM-DD" string. */
export const parseIsoDate = (isoDate) => {
  const [year, month, day] = String(isoDate).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** A Date (default: now) as "YYYY-MM-DD" in local time. */
export const toIsoDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const todayIso = () => toIsoDate(new Date());

/** "YYYY-MM-DD" shifted by n days. */
export const addDays = (isoDate, days) => {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

export const weekdayName = (isoDate) => WEEKDAYS[parseIsoDate(isoDate).getDay()];

/** 12500 -> "₹12,500" */
export const formatCurrency = (amount) => {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) return '₹0';
  return `${value < 0 ? '-' : ''}₹${Math.abs(value).toLocaleString('en-IN')}`;
};

/** "Rohit Verma" -> "RV" */
export const initialsOf = (name = '') =>
  String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
