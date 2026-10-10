import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate, parseIsoDate, toIsoDate, todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_STYLES = {
  HOLIDAY: { chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Holiday' },
  EVENT: { chip: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Event' },
};

/** 6-week grid (Sunday first) for a month. */
const buildMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { iso: toIsoDate(date), day: date.getDate(), weekday: date.getDay(), isCurrentMonth: date.getMonth() === month };
  });
};

const coversDate = (entry, iso) => iso >= entry.startDate && iso <= (entry.endDate || entry.startDate);

const dateRangeLabel = (entry) =>
  entry.endDate && entry.endDate !== entry.startDate
    ? `${formatDate(entry.startDate)} – ${formatDate(entry.endDate)}`
    : formatDate(entry.startDate);

/**
 * Holiday & event calendar for every portal: month grid (holidays red, events blue, Sundays shaded) and the
 * month's list. With `canEdit` (admin) entries can be added, edited and deleted.
 */
export const EventCalendar = ({ canEdit = false }) => {
  const today = todayIso();
  const todayDate = parseIsoDate(today);
  const [view, setView] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });
  const [form, setForm] = useState(null); // null = closed, {} = new, entry = edit
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const from = grid[0].iso;
  const to = grid[grid.length - 1].iso;
  const entries = useApi(withQuery('/calendar', { from, to }));

  const monthStart = toIsoDate(new Date(view.year, view.month, 1));
  const monthEnd = toIsoDate(new Date(view.year, view.month + 1, 0));
  const monthEntries = (entries.data ?? [])
    .filter((e) => e.startDate <= monthEnd && (e.endDate || e.startDate) >= monthStart)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const shiftMonth = (delta) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const remove = async (entry) => {
    if (!window.confirm(`Delete "${entry.title}"?`)) return;
    setDeleting(entry.id);
    setError('');
    try {
      await http.delete(`/calendar/${entry.id}`);
      entries.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {MONTH_NAMES[view.month]} {view.year}
              </h2>
              <button
                type="button"
                onClick={() => setView({ year: todayDate.getFullYear(), month: todayDate.getMonth() })}
                className="text-[11px] font-bold text-[#FF6B2C] hover:underline cursor-pointer"
              >
                Today
              </button>
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} className={`text-[10px] sm:text-[11px] font-bold uppercase py-1 ${d === 'Sun' ? 'text-rose-500' : 'text-slate-400'}`}>
                {d}
              </div>
            ))}
            {grid.map((cell) => {
              const dayEntries = (entries.data ?? []).filter((e) => coversDate(e, cell.iso));
              const holiday = cell.weekday === 0 || dayEntries.some((e) => e.type === 'HOLIDAY');
              const isToday = cell.iso === today;
              return (
                <div
                  key={cell.iso}
                  title={dayEntries.map((e) => e.title).join(', ')}
                  className={`min-h-[52px] sm:min-h-[76px] rounded-xl border p-1 sm:p-1.5 text-left flex flex-col gap-0.5 overflow-hidden ${
                    !cell.isCurrentMonth ? 'opacity-40' : ''
                  } ${holiday ? 'bg-rose-50/60 border-rose-100' : 'bg-white border-slate-100'} ${
                    isToday ? 'ring-2 ring-[#FF6B2C]' : ''
                  }`}
                >
                  <span className={`text-[11px] sm:text-xs font-bold ${holiday ? 'text-rose-600' : 'text-slate-700'}`}>{cell.day}</span>
                  {dayEntries.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className={`hidden sm:block truncate rounded px-1 py-px text-[10px] font-semibold border ${TYPE_STYLES[e.type]?.chip ?? TYPE_STYLES.EVENT.chip}`}
                    >
                      {e.title}
                    </span>
                  ))}
                  {dayEntries.length > 0 && (
                    <span className="sm:hidden flex gap-0.5">
                      {dayEntries.slice(0, 3).map((e) => (
                        <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_STYLES[e.type]?.dot ?? TYPE_STYLES.EVENT.dot}`} />
                      ))}
                    </span>
                  )}
                  {dayEntries.length > 2 && (
                    <span className="hidden sm:block text-[10px] font-semibold text-slate-400">+{dayEntries.length - 2} more</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Holiday (and Sundays)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Event
            </span>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {MONTH_NAMES[view.month]} — holidays & events
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() => setForm({})}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B2C] px-3 py-2 text-xs font-bold text-white hover:bg-[#F25A1B] cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            )}
          </div>
          <AsyncState state={entries} loadingText="Loading calendar…">
            {() =>
              monthEntries.length === 0 ? (
                <EmptyMessage text="No holidays or events this month." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {monthEntries.map((e) => {
                    const style = TYPE_STYLES[e.type] ?? TYPE_STYLES.EVENT;
                    return (
                      <li key={e.id} className="p-4 flex gap-3">
                        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900">{e.title}</p>
                            <span className={`rounded-md border px-1.5 py-px text-[10px] font-bold ${style.chip}`}>{style.label}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">{dateRangeLabel(e)}</p>
                          {e.description && <p className="text-xs text-slate-600 mt-1">{e.description}</p>}
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setForm(e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                              aria-label="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(e)}
                              disabled={deleting === e.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                              aria-label="Delete"
                            >
                              {deleting === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            }
          </AsyncState>
        </div>
      </div>

      {form && (
        <CalendarEntryModal
          entry={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            entries.reload();
          }}
        />
      )}
    </div>
  );
};

const CalendarEntryModal = ({ entry, onClose, onSaved }) => {
  const { tx } = useI18n();
  const [values, setValues] = useState({
    title: entry?.title ?? '',
    type: entry?.type ?? 'HOLIDAY',
    startDate: entry?.startDate ?? todayIso(),
    endDate: entry?.endDate ?? '',
    description: entry?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      title: values.title.trim(),
      type: values.type,
      startDate: values.startDate,
      endDate: values.endDate || null,
      description: values.description.trim() || null,
    };
    try {
      if (entry) await http.put(`/calendar/${entry.id}`, body);
      else await http.post('/calendar', body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const inputClass =
    'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">{entry ? 'Edit entry' : 'Add holiday or event'}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">Title</span>
          <input required value={values.title} onChange={set('title')} className={inputClass} placeholder="e.g. Diwali break" />
        </label>

        <div className="flex gap-2">
          {['HOLIDAY', 'EVENT'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValues((v) => ({ ...v, type: t }))}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer ${
                values.type === t ? TYPE_STYLES[t].chip : 'border-slate-200 text-slate-500'
              }`}
            >
              {TYPE_STYLES[t].label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">From</span>
            <input type="date" required value={values.startDate} onChange={set('startDate')} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">To (optional)</span>
            <input type="date" value={values.endDate} min={values.startDate} onChange={set('endDate')} className={inputClass} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">Description (optional)</span>
          <textarea
            rows={3}
            value={values.description}
            onChange={set('description')}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
          />
        </label>

        {values.type === 'HOLIDAY' && (
          <p className="text-[11px] text-slate-500">No attendance can be marked on holidays. Upcoming entries notify everyone.</p>
        )}

        {error && (
          <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
            {tx('Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60"
          >
            {saving ? tx('Saving…') : tx('Save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventCalendar;
