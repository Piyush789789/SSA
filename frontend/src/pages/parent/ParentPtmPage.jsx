import React, { useMemo, useState } from 'react';
import { CalendarCheck, CalendarClock, Handshake, MapPin, UserRound, XCircle } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  FormError,
  FormField,
  Modal,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textAreaClass,
} from '@/components/common/Modal';
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

const bySlotTime = (a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
const isBooked = (slot) => Boolean(slot.parentId || slot.studentId);
const childIdOf = (child) => child?.studentId ?? child?.id;

/** Free slots grouped by teacher, then by date: [{teacherId, teacherName, days:[[date, slots]]}]. */
const groupByTeacherAndDate = (slots) => {
  const teachers = new Map();
  [...slots].sort(bySlotTime).forEach((slot) => {
    if (!teachers.has(slot.teacherId)) {
      teachers.set(slot.teacherId, { teacherId: slot.teacherId, teacherName: slot.teacherName, days: new Map() });
    }
    const days = teachers.get(slot.teacherId).days;
    if (!days.has(slot.date)) days.set(slot.date, []);
    days.get(slot.date).push(slot);
  });
  return [...teachers.values()]
    .map((teacher) => ({ ...teacher, days: [...teacher.days.entries()] }))
    .sort((a, b) => String(a.teacherName).localeCompare(String(b.teacherName)));
};

const BookDialog = ({ slot, kids, defaultChildId, onClose, onBooked }) => {
  const { t, tx } = useI18n();
  const [studentId, setStudentId] = useState(
    kids.some((c) => childIdOf(c) === defaultChildId) ? defaultChildId : childIdOf(kids[0]),
  );
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await http.post(`/ptm/slots/${encodeURIComponent(slot.id)}/book`, { studentId, note: note.trim() || null });
      onBooked();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('ptm.bookSlot')}
      subtitle={`${slot.teacherName} · ${formatDate(slot.date)}, ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`}
      icon={CalendarCheck}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            {tx('Cancel')}
          </button>
          <button type="button" onClick={submit} disabled={busy || !studentId} className={primaryButtonClass}>
            {busy ? t('ptm.booking') : t('ptm.book')}
          </button>
        </>
      }
    >
      <p className="text-xs font-semibold text-slate-600">{slot.title}</p>
      {slot.location && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {slot.location}
        </p>
      )}
      <FormField label={t('ptm.whichChild')} required>
        <select className={fieldClass} value={studentId ?? ''} onChange={(e) => setStudentId(e.target.value)}>
          {kids.map((c) => (
            <option key={childIdOf(c)} value={childIdOf(c)}>
              {c.name}
              {c.className ? ` (${c.className})` : ''}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('ptm.noteForTeacher')} hint={t('ptm.optional')}>
        <textarea rows={3} maxLength={500} className={textAreaClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </FormField>
      <FormError message={error} />
    </Modal>
  );
};

/** /parent/ptm — book a meeting with the children's teachers, and see / cancel own bookings. */
export const ParentPtmPage = () => {
  const { t, tx } = useI18n();
  const { currentUser, selectedChild } = useAuth();
  const [from] = useState(todayIso);
  const slots = useApi(withQuery('/ptm/slots', { from }));
  const [booking, setBooking] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const children = useMemo(() => currentUser?.linkedChildren ?? [], [currentUser]);
  const parentId = currentUser?.parentId ?? currentUser?.id;
  const list = useMemo(() => slots.data ?? [], [slots.data]);
  const myBookings = useMemo(() => list.filter((s) => s.parentId && s.parentId === parentId).sort(bySlotTime), [list, parentId]);
  const freeByTeacher = useMemo(() => groupByTeacherAndDate(list.filter((s) => !isBooked(s))), [list]);

  const cancelBooking = async () => {
    await http.delete(`/ptm/slots/${encodeURIComponent(cancelling.id)}/booking`);
    setCancelling(null);
    slots.reload();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader icon={Handshake} title={t('ptm.bookTitle')} description={t('ptm.parentDescription')} />

      {children.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <EmptyMessage text={t('ptm.noChildren')} />
        </div>
      ) : (
        <AsyncState state={slots}>
          {() => (
            <>
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-[#FF6B2C]" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('ptm.myBookings')}</h2>
                </div>
                {myBookings.length === 0 ? (
                  <EmptyMessage text={t('ptm.noBookings')} />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {myBookings.map((slot) => (
                      <div key={slot.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold leading-none">{formatDate(slot.date).split(' ')[1]}</span>
                          <span className="text-base font-extrabold leading-tight">{formatDate(slot.date).split(' ')[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="text-sm font-bold text-slate-900">
                            {slot.teacherName} · {slot.title}
                          </p>
                          <p className="text-xs text-slate-600">
                            {tx(weekdayName(slot.date))}, {formatDate(slot.date)} · {formatTime(slot.startTime)} –{' '}
                            {formatTime(slot.endTime)}
                          </p>
                          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="w-3 h-3" /> {slot.studentName}
                              {slot.className ? ` (${slot.className})` : ''}
                            </span>
                            {slot.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {slot.location}
                              </span>
                            )}
                          </p>
                          {slot.parentNote && <p className="text-xs text-slate-500 italic">“{slot.parentNote}”</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCancelling(slot)}
                          className="inline-flex items-center gap-1 self-start sm:self-center rounded-xl border border-rose-200 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> {t('ptm.cancelBooking')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-[#FF6B2C]" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('ptm.availableSlots')}</h2>
                </div>
                {freeByTeacher.length === 0 ? (
                  <EmptyMessage text={t('ptm.noFreeSlots')} />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {freeByTeacher.map((teacher) => (
                      <div key={teacher.teacherId} className="p-4 sm:p-5 space-y-3">
                        <p className="text-sm font-bold text-slate-900">{teacher.teacherName}</p>
                        {teacher.days.map(([date, daySlots]) => (
                          <div key={date} className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500">
                              {formatDate(date)} · {tx(weekdayName(date))}
                              {daySlots[0]?.location ? ` · ${daySlots[0].location}` : ''}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {daySlots.map((slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setBooking(slot)}
                                  title={slot.title}
                                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#FF6B2C] hover:bg-orange-50 hover:text-[#FF6B2C] cursor-pointer"
                                >
                                  {formatTime(slot.startTime)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </AsyncState>
      )}

      {booking && (
        <BookDialog
          slot={booking}
          kids={children}
          defaultChildId={childIdOf(selectedChild)}
          onClose={() => setBooking(null)}
          onBooked={() => {
            setBooking(null);
            slots.reload();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(cancelling)}
        title={t('ptm.cancelBooking')}
        message={t('ptm.cancelBookingMessage')}
        detail={
          cancelling
            ? `${cancelling.teacherName} · ${formatDate(cancelling.date)}, ${formatTime(cancelling.startTime)} · ${cancelling.studentName || ''}`
            : null
        }
        confirmLabel={t('ptm.cancelBooking')}
        onClose={() => setCancelling(null)}
        onConfirm={cancelBooking}
      />
    </div>
  );
};

export default ParentPtmPage;
