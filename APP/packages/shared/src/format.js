const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function rupees(amount) {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function percent(value) {
  return value == null ? '—' : `${value}%`;
}

/** "2026-10-10" -> "10 Oct 2026". Parsed by hand so the date never shifts with the timezone. */
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  const [year, month, day] = String(isoDate).slice(0, 10).split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** "2026-10-06T10:30:00" -> "6 Oct 2026, 10:30 AM". */
export function formatDateTime(isoDateTime) {
  if (!isoDateTime) return '—';
  const [date, time = ''] = String(isoDateTime).split('T');
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return formatDate(date);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${formatDate(date)}, ${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function weekdayOf(isoDate) {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  return DAYS[new Date(year, month - 1, day).getDay()];
}

/** Today's date as "YYYY-MM-DD" in the phone's local time (toISOString would give the UTC date). */
export function todayIso() {
  return isoOf(new Date());
}

export function daysAgoIso(days) {
  return daysFromTodayIso(-days);
}

export function daysFromTodayIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoOf(date);
}

/** "2026-10-10" -> { day: 10, month: "Oct", weekday: "Sat" } */
export function dateParts(isoDate) {
  const [year, month, day] = String(isoDate).slice(0, 10).split('-').map(Number);
  return { day, month: MONTHS[month - 1], weekday: DAYS[new Date(year, month - 1, day).getDay()].slice(0, 3) };
}

/** isoDate plus n days, as "YYYY-MM-DD". */
export function addDaysIso(isoDate, days) {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  return isoOf(new Date(year, month - 1, day + days));
}

/** Monday = 0 … Sunday = 6. */
export function mondayIndex(isoDate) {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  return (new Date(year, month - 1, day).getDay() + 6) % 7;
}

/** Current local time as "HH:mm", comparable with the timetable's period times. */
export function nowHHmm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function isoOf(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
