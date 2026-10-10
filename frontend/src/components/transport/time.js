/** "08:05" -> "8:05 AM" (times from the backend are "HH:mm"). */
export const formatTime = (hhmm) => {
  if (!hhmm) return '—';
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
