import React, { useMemo, useState } from 'react';
import { CalendarClock, CalendarPlus, Handshake, MapPin, Trash2, UserCheck, XCircle } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { PageHeader } from '@/components/common/PageHeader';
import { FormError, FormField, FormSuccess, fieldClass, primaryButtonClass } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';
import { useI18n } from '@/i18n/translate';
import { formatDate, todayIso, weekdayName } from '@/utils';

const MINUTE_OPTIONS = [10, 15, 20, 30];

/** "14:30" or "14:30:00" -> "2:30 PM". */
const formatTime = (value) => {
  if (!value) return '—';
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h)) return value;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const bySlotTime = (a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

const groupByDate = (slots) => {
  const groups = new Map();
  [...slots].sort(bySlotTime).forEach((slot) => {
    if (!groups.has(slot.date)) groups.set(slot.date, []);
    groups.get(slot.date).push(slot);
  });
  return [...groups.entries()];
};

const isBooked = (slot) => Boolean(slot.parentId || slot.studentId);

const emptyForm = () => ({ title: 'Parent-Teacher Meeting', date: todayIso(), from: '10:00', to: '12:00', minutes: 15, location: '' });

const CreateSlotsForm = ({ onCreated }) => {
  const { t } = useI18n();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.title.trim()) return setError('Please enter a title.');
    if (form.date < todayIso()) return setError('The date cannot be in the past.');
    if (form.from >= form.to) return setError('The end time must be after the start time.');
    setSaving(true);
    try {
      const created = await http.post('/ptm/slots', {
        title: form.title.trim(),
        date: form.date,
        from: form.from,
        to: form.to,
        minutes: Number(form.minutes),
        location: form.location.trim() || null,
      });
      setSuccess(t('ptm.createdCount', { n: Array.isArray(created) ? created.length : 0 }));
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
          <CalendarPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('ptm.createSlots')}</h2>
          <p className="text-xs text-slate-500">{t('ptm.createSlotsHint')}</p>
        </div>
      </div>

      <FormField label={t('ptm.meetingTitle')} required>
        <input className={fieldClass} value={form.title} maxLength={80} onChange={set('title')} />
      </FormField>
      <FormField label={t('common.date')} required>
        <input type="date" className={fieldClass} value={form.date} min={todayIso()} onChange={set('date')} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('ptm.from')} required>
          <input type="time" className={fieldClass} value={form.from} onChange={set('from')} />
        </FormField>
        <FormField label={t('ptm.to')} required>
          <input type="time" className={fieldClass} value={form.to} onChange={set('to')} />
        </FormField>
      </div>
      <FormField label={t('ptm.slotLength')} required>
        <select className={fieldClass} value={form.minutes} onChange={set('minutes')}>
          {MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {t('ptm.minutes', { n: m })}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('ptm.location')} hint={t('ptm.optional')}>
        <input className={fieldClass} value={form.location} maxLength={200} onChange={set('location')} placeholder="e.g. Room 12" />
      </FormField>

      <FormError message={error} />
      <FormSuccess message={success} />

      <button type="submit" disabled={saving} className={`${primaryButtonClass} w-full`}>
        {saving ? t('ptm.creating') : t('ptm.createSlots')}
      </button>
    </form>
  );
};

const SummaryTile = ({ label, value, tone }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`text-2xl font-extrabold mt-1 ${tone}`}>{value}</p>
  </div>
);

const SlotRow = ({ slot, onCancelBooking, onDelete }) => {
  const { t } = useI18n();
  const booked = isBooked(slot);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-slate-100 last:border-b-0">
      <div className="sm:w-40 shrink-0">
        <p className="text-sm font-bold text-slate-900">
          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
        </p>
        {slot.location && (
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {slot.location}
          </p>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {booked ? (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[11px] font-bold">
              <UserCheck className="w-3 h-3" /> {t('ptm.booked')}
            </span>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              {slot.parentName || '—'} · {slot.studentName || '—'}
              {slot.className ? ` (${slot.className})` : ''}
            </p>
            {slot.parentNote && <p className="text-xs text-slate-500 mt-0.5 italic">“{slot.parentNote}”</p>}
          </div>
        ) : (
          <span className="inline-flex rounded-full bg-slate-100 text-slate-500 px-2.5 py-0.5 text-[11px] font-bold">{t('ptm.free')}</span>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        {booked && (
          <button
            type="button"
            onClick={() => onCancelBooking(slot)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" /> {t('ptm.cancelBooking')}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(slot)}
          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t('ptm.deleteSlot')}
        </button>
      </div>
    </div>
  );
};

/** /teacher/ptm — create PTM slots and see the bookings, grouped by date. */
export const TeacherPtmPage = () => {
  const { t, tx } = useI18n();
  const [from] = useState(todayIso);
  const slots = useApi(withQuery('/ptm/slots', { from }));
  const [confirm, setConfirm] = useState(null); // {type:'cancel'|'delete', slot}

  const list = useMemo(() => slots.data ?? [], [slots.data]);
  const bookedCount = list.filter(isBooked).length;

  const runConfirm = async () => {
    const { type, slot } = confirm;
    if (type === 'cancel') await http.delete(`/ptm/slots/${encodeURIComponent(slot.id)}/booking`);
    else await http.delete(`/ptm/slots/${encodeURIComponent(slot.id)}`);
    setConfirm(null);
    slots.reload();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader icon={Handshake} title={t('ptm.title')} description={t('ptm.teacherDescription')} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4">
          <CreateSlotsForm onCreated={slots.reload} />
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <SummaryTile label={t('ptm.total')} value={list.length} tone="text-slate-900" />
            <SummaryTile label={t('ptm.booked')} value={bookedCount} tone="text-emerald-600" />
            <SummaryTile label={t('ptm.free')} value={list.length - bookedCount} tone="text-[#FF6B2C]" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[#FF6B2C]" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('ptm.upcomingSlots')}</h2>
            </div>
            <AsyncState state={slots}>
              {() =>
                list.length === 0 ? (
                  <EmptyMessage text={t('ptm.noSlots')} />
                ) : (
                  groupByDate(list).map(([date, daySlots]) => (
                    <div key={date}>
                      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700">
                          {formatDate(date)} · {tx(weekdayName(date))}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {daySlots.filter(isBooked).length}/{daySlots.length} {t('ptm.booked')}
                        </p>
                      </div>
                      {daySlots.map((slot) => (
                        <SlotRow
                          key={slot.id}
                          slot={slot}
                          onCancelBooking={(s) => setConfirm({ type: 'cancel', slot: s })}
                          onDelete={(s) => setConfirm({ type: 'delete', slot: s })}
                        />
                      ))}
                    </div>
                  ))
                )
              }
            </AsyncState>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={confirm?.type === 'cancel' ? t('ptm.cancelBooking') : t('ptm.deleteSlot')}
        message={confirm?.type === 'cancel' ? t('ptm.cancelBookingMessage') : t('ptm.deleteSlotMessage')}
        detail={
          confirm
            ? `${formatDate(confirm.slot.date)}, ${formatTime(confirm.slot.startTime)} – ${formatTime(confirm.slot.endTime)}${
                isBooked(confirm.slot) ? ` · ${confirm.slot.parentName || ''} (${confirm.slot.studentName || ''})` : ''
              }`
            : null
        }
        confirmLabel={confirm?.type === 'cancel' ? t('ptm.cancelBooking') : t('ptm.deleteSlot')}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
};

export default TeacherPtmPage;
