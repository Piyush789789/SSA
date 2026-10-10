/** "08:05" -> "8:05 AM" (times from the backend are "HH:mm"). */
export const formatTime = (hhmm) => {
  if (!hhmm) return '—';
  const [h, m = 0] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const minutes = Number.isNaN(m) ? 0 : m;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(minutes).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
