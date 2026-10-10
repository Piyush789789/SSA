/** Display colours for subjects (pure UI). A subject always gets the same colour. */
const PALETTE = [
  { badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', colorBg: 'bg-indigo-50/70', colorText: 'text-indigo-800', colorBorder: 'border-indigo-200' },
  { badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', colorBg: 'bg-emerald-50/70', colorText: 'text-emerald-800', colorBorder: 'border-emerald-200' },
  { badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', colorBg: 'bg-amber-50/70', colorText: 'text-amber-800', colorBorder: 'border-amber-200' },
  { badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', colorBg: 'bg-rose-50/70', colorText: 'text-rose-800', colorBorder: 'border-rose-200' },
  { badgeClass: 'bg-sky-50 text-sky-700 border-sky-200', colorBg: 'bg-sky-50/70', colorText: 'text-sky-800', colorBorder: 'border-sky-200' },
  { badgeClass: 'bg-violet-50 text-violet-700 border-violet-200', colorBg: 'bg-violet-50/70', colorText: 'text-violet-800', colorBorder: 'border-violet-200' },
  { badgeClass: 'bg-teal-50 text-teal-700 border-teal-200', colorBg: 'bg-teal-50/70', colorText: 'text-teal-800', colorBorder: 'border-teal-200' },
  { badgeClass: 'bg-orange-50 text-orange-700 border-orange-200', colorBg: 'bg-orange-50/70', colorText: 'text-orange-800', colorBorder: 'border-orange-200' },
  { badgeClass: 'bg-lime-50 text-lime-700 border-lime-200', colorBg: 'bg-lime-50/70', colorText: 'text-lime-800', colorBorder: 'border-lime-200' },
  { badgeClass: 'bg-pink-50 text-pink-700 border-pink-200', colorBg: 'bg-pink-50/70', colorText: 'text-pink-800', colorBorder: 'border-pink-200' },
];

export const subjectColors = (subject = '') => {
  let hash = 0;
  for (let i = 0; i < subject.length; i += 1) hash = (hash * 31 + subject.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

export const TIMETABLE_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
