import React, { useMemo, useState } from 'react';
import { MapPin, UserCheck, XCircle } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { fieldClass } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';
import { useI18n } from '@/i18n/translate';
import { formatDate, todayIso, weekdayName } from '@/utils';

/** "14:30" or "14:30:00" -> "2:30 PM". */
const formatTime = (value) => {
  if (!value) return '—';
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h)) return value;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const isBooked = (slot) => Boolean(slot.parentId || slot.studentId);

/** [[date, [[teacherName, slots]]]] sorted by date, teacher and time. */
const groupByDateAndTeacher = (slots) => {
  const dates = new Map();
  [...slots]
    .sort((a, b) =>
      `${a.date} ${a.teacherName} ${a.startTime}`.localeCompare(`${b.date} ${b.teacherName} ${b.startTime}`),
    )
    .forEach((slot) => {
      if (!dates.has(slot.date)) dates.set(slot.date, new Map());
      const teachers = dates.get(slot.date);
      const key = slot.teacherId;
      if (!teachers.has(key)) teachers.set(key, { teacherName: slot.teacherName, slots: [] });
      teachers.get(key).slots.push(slot);
    });
  return [...dates.entries()].map(([date, teachers]) => [date, [...teachers.entries()]]);
};

const StatTile = ({ label, value, tone }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${tone}`}>{value}</p>
  </div>
);

/** /admin/ptm — all PTM slots from a date, by date and teacher; the admin can cancel bookings. */
export const PtmOverviewPage = () => {
  const { t, tx } = useI18n();
  const [from, setFrom] = useState(todayIso);
  const [teacherId, setTeacherId] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const slots = useApi(withQuery('/ptm/slots', { from }));

  const all = useMemo(() => slots.data ?? [], [slots.data]);
  const teachers = useMemo(() => {
    const map = new Map();
    all.forEach((s) => map.set(s.teacherId, s.teacherName));
    return [...map.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  }, [all]);
  const visible = useMemo(() => (teacherId ? all.filter((s) => s.teacherId === teacherId) : all), [all, teacherId]);
  const bookedCount = visible.filter(isBooked).length;
  const teacherCount = new Set(visible.map((s) => s.teacherId)).size;

  const cancelBooking = async () => {
    await http.delete(`/ptm/slots/${encodeURIComponent(cancelling.id)}/booking`);
    setCancelling(null);
    slots.reload();
  };

  return (
    <AdminPageShell
      activeItemId="ptm"
      title={t('ptm.overviewTitle')}
      description={t('ptm.adminDescription')}
      actions={
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-500">{t('ptm.showFrom')}</span>
            <input type="date" className={`${fieldClass} bg-white w-40`} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-500">{t('ptm.teacher')}</span>
            <select className={`${fieldClass} bg-white w-48`} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">{t('ptm.allTeachers')}</option>
              {teachers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
    >
      <AsyncState state={slots}>
        {() => (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile label={t('ptm.total')} value={visible.length} tone="text-slate-900" />
              <StatTile label={t('ptm.booked')} value={bookedCount} tone="text-emerald-600" />
              <StatTile label={t('ptm.free')} value={visible.length - bookedCount} tone="text-[#FF6B2C]" />
              <StatTile label={t('ptm.teachers')} value={teacherCount} tone="text-indigo-600" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              {visible.length === 0 ? (
                <EmptyMessage text={t('ptm.noSlots')} />
              ) : (
                groupByDateAndTeacher(visible).map(([date, teacherGroups]) => (
                  <div key={date}>
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">
                        {formatDate(date)} · {tx(weekdayName(date))}
                      </p>
                    </div>
                    {teacherGroups.map(([tid, group]) => {
                      const booked = group.slots.filter(isBooked);
                      return (
                        <div key={tid} className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{group.teacherName}</p>
                              <p className="text-[11px] text-slate-500">
                                {group.slots[0].title} · {formatTime(group.slots[0].startTime)} –{' '}
                                {formatTime(group.slots[group.slots.length - 1].endTime)}
                                {group.slots[0].location ? ` · ${group.slots[0].location}` : ''}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                              {booked.length}/{group.slots.length} {t('ptm.booked')}
                            </span>
                          </div>
                          {booked.length > 0 && (
                            <div className="space-y-2">
                              {booked.map((slot) => (
                                <div
                                  key={slot.id}
                                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                                >
                                  <p className="text-xs font-bold text-slate-800 sm:w-36 shrink-0">
                                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                  </p>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      {slot.parentName || '—'} · {slot.studentName || '—'}
                                      {slot.className ? ` (${slot.className})` : ''}
                                    </p>
                                    {slot.location && slot.location !== group.slots[0].location && (
                                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {slot.location}
                                      </p>
                                    )}
                                    {slot.parentNote && <p className="text-[11px] text-slate-500 italic">“{slot.parentNote}”</p>}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setCancelling(slot)}
                                    className="inline-flex items-center gap-1 self-start sm:self-center rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> {t('ptm.cancelBooking')}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </AsyncState>

      <ConfirmDialog
        isOpen={Boolean(cancelling)}
        title={t('ptm.cancelBooking')}
        message={t('ptm.cancelBookingMessage')}
        detail={
          cancelling
            ? `${cancelling.teacherName} · ${formatDate(cancelling.date)}, ${formatTime(cancelling.startTime)} · ${
                cancelling.parentName || ''
              } (${cancelling.studentName || ''})`
            : null
        }
        confirmLabel={t('ptm.cancelBooking')}
        onClose={() => setCancelling(null)}
        onConfirm={cancelBooking}
      />
    </AdminPageShell>
  );
};

export default PtmOverviewPage;
