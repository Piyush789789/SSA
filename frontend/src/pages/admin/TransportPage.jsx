import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bus,
  Clock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import {
  FormError,
  FormField,
  Modal,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/common/Modal';
import { StudentPicker } from '@/components/common/StudentPicker';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';
import { formatTime } from '@/components/transport/time';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/utils';
import { useI18n } from '@/i18n/translate';

const emptyRoute = () => ({
  name: '',
  vehicleNumber: '',
  driverName: '',
  driverPhone: '',
  attendantName: '',
  attendantPhone: '',
  capacity: '40',
  monthlyFee: '0',
  stops: [{ name: '', pickupTime: '', dropTime: '' }],
});

const routeToForm = (route) => ({
  name: route.name ?? '',
  vehicleNumber: route.vehicleNumber ?? '',
  driverName: route.driverName ?? '',
  driverPhone: route.driverPhone ?? '',
  attendantName: route.attendantName ?? '',
  attendantPhone: route.attendantPhone ?? '',
  capacity: String(route.capacity ?? ''),
  monthlyFee: String(route.monthlyFee ?? 0),
  stops: (route.stops ?? []).map((s) => ({
    name: s.name ?? '',
    pickupTime: (s.pickupTime ?? '').slice(0, 5),
    dropTime: (s.dropTime ?? '').slice(0, 5),
  })),
});

const orNull = (value) => (value && String(value).trim() ? String(value).trim() : null);

/** Add / edit a route with its stops (POST or PUT /transport/routes). */
const RouteFormModal = ({ route, onClose, onSaved }) => {
  const { t, tx } = useI18n();
  const [form, setForm] = useState(() => (route ? routeToForm(route) : emptyRoute()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setStop = (index, key, value) =>
    setForm((f) => ({ ...f, stops: f.stops.map((s, i) => (i === index ? { ...s, [key]: value } : s)) }));
  const addStop = () => setForm((f) => ({ ...f, stops: [...f.stops, { name: '', pickupTime: '', dropTime: '' }] }));
  const removeStop = (index) => setForm((f) => ({ ...f, stops: f.stops.filter((_, i) => i !== index) }));
  const moveStop = (index, delta) =>
    setForm((f) => {
      const stops = [...f.stops];
      const target = index + delta;
      if (target < 0 || target >= stops.length) return f;
      [stops[index], stops[target]] = [stops[target], stops[index]];
      return { ...f, stops };
    });

  const submit = async (e) => {
    e.preventDefault();
    const stops = form.stops.filter((s) => s.name.trim());
    if (!form.name.trim()) return setError(t('transport.errName'));
    if (!(Number(form.capacity) >= 1)) return setError(t('transport.errCapacity'));
    if (stops.length === 0) return setError(t('transport.errStops'));
    const names = stops.map((s) => s.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) return setError(t('transport.errDuplicateStop'));

    const body = {
      name: form.name.trim(),
      vehicleNumber: orNull(form.vehicleNumber),
      driverName: orNull(form.driverName),
      driverPhone: orNull(form.driverPhone),
      attendantName: orNull(form.attendantName),
      attendantPhone: orNull(form.attendantPhone),
      capacity: Number(form.capacity),
      monthlyFee: Number(form.monthlyFee) || 0,
      stops: stops.map((s) => ({ name: s.name.trim(), pickupTime: s.pickupTime || null, dropTime: s.dropTime || null })),
    };
    setSaving(true);
    setError('');
    try {
      if (route) await http.put(`/transport/routes/${encodeURIComponent(route.id)}`, body);
      else await http.post('/transport/routes', body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={route ? t('transport.editRoute') : t('transport.addRoute')}
      icon={Bus}
      size="lg"
      busy={saving}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={t('transport.routeName')} required>
            <input value={form.name} onChange={set('name')} maxLength={60} placeholder="e.g. Route 1 — Civil Lines" className={fieldClass} />
          </FormField>
          <FormField label={t('transport.vehicle')}>
            <input value={form.vehicleNumber} onChange={set('vehicleNumber')} maxLength={20} placeholder="UP 15 AB 1234" className={fieldClass} />
          </FormField>
          <FormField label={t('transport.driver')}>
            <input value={form.driverName} onChange={set('driverName')} maxLength={60} className={fieldClass} />
          </FormField>
          <FormField label={t('transport.driverPhone')}>
            <input type="tel" value={form.driverPhone} onChange={set('driverPhone')} maxLength={20} className={fieldClass} />
          </FormField>
          <FormField label={t('transport.attendant')}>
            <input value={form.attendantName} onChange={set('attendantName')} maxLength={60} className={fieldClass} />
          </FormField>
          <FormField label={t('transport.attendantPhone')}>
            <input type="tel" value={form.attendantPhone} onChange={set('attendantPhone')} maxLength={20} className={fieldClass} />
          </FormField>
          <FormField label={t('transport.capacity')} required>
            <input type="number" min="1" value={form.capacity} onChange={set('capacity')} className={fieldClass} />
          </FormField>
          <FormField label={t('transport.monthlyFee')}>
            <input type="number" min="0" value={form.monthlyFee} onChange={set('monthlyFee')} className={fieldClass} />
          </FormField>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">{t('transport.stopsInOrder')}</p>
            <button type="button" onClick={addStop} className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B2C] cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {t('transport.addStop')}
            </button>
          </div>
          <div className="hidden sm:grid grid-cols-[1fr_110px_110px_84px] gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>{t('transport.stop')}</span>
            <span>{t('transport.pickup')}</span>
            <span>{t('transport.drop')}</span>
            <span />
          </div>
          {form.stops.map((stop, index) => (
            <div key={index} className="grid grid-cols-2 sm:grid-cols-[1fr_110px_110px_84px] gap-2 items-center">
              <input
                value={stop.name}
                onChange={(e) => setStop(index, 'name', e.target.value)}
                maxLength={80}
                placeholder={`${t('transport.stop')} ${index + 1}`}
                className={`${fieldClass} col-span-2 sm:col-span-1`}
              />
              <input type="time" value={stop.pickupTime} onChange={(e) => setStop(index, 'pickupTime', e.target.value)} className={fieldClass} aria-label={t('transport.pickup')} />
              <input type="time" value={stop.dropTime} onChange={(e) => setStop(index, 'dropTime', e.target.value)} className={fieldClass} aria-label={t('transport.drop')} />
              <div className="flex items-center gap-0.5 col-span-2 sm:col-span-1 justify-end">
                <button type="button" onClick={() => moveStop(index, -1)} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer" aria-label="Move up">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => moveStop(index, 1)} disabled={index === form.stops.length - 1} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer" aria-label="Move down">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removeStop(index)} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer" aria-label={tx('Remove')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <FormError message={error} />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/** Put a student on a route at a stop (PUT /transport/assignments). Re-assigning moves the student. */
const AssignModal = ({ routes, initialRouteId, onClose, onSaved }) => {
  const { t } = useI18n();
  const [student, setStudent] = useState(null);
  const [routeId, setRouteId] = useState(initialRouteId ?? routes[0]?.route.id ?? '');
  const [stopName, setStopName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const route = routes.find((r) => r.route.id === routeId)?.route;
  const current = routes.flatMap((r) => r.riders.map((rider) => ({ ...rider, routeName: r.route.name }))).find((r) => r.id === student?.id);

  const submit = async (e) => {
    e.preventDefault();
    if (!student || !routeId || !stopName) return;
    setSaving(true);
    setError('');
    try {
      await http.put('/transport/assignments', { studentId: student.id, routeId, stopName });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={t('transport.assignStudent')} icon={UserPlus} busy={saving} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormField label={t('transport.student')} required>
          <StudentPicker value={student} onChange={setStudent} autoFocus />
        </FormField>
        {current && (
          <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            {t('transport.alreadyOn', { route: current.routeName, stop: current.stopName })}
          </p>
        )}
        <FormField label={t('transport.route')} required>
          <select
            value={routeId}
            onChange={(e) => {
              setRouteId(e.target.value);
              setStopName('');
            }}
            className={`${fieldClass} cursor-pointer`}
          >
            {routes.map(({ route: r, students }) => (
              <option key={r.id} value={r.id}>
                {r.name} ({students}/{r.capacity})
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={t('transport.stop')} required>
          <select value={stopName} onChange={(e) => setStopName(e.target.value)} className={`${fieldClass} cursor-pointer`}>
            <option value="">{t('transport.chooseStop')}</option>
            {(route?.stops ?? []).map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
                {s.pickupTime ? ` — ${formatTime(s.pickupTime)}` : ''}
              </option>
            ))}
          </select>
        </FormField>
        <FormError message={error} />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving || !student || !stopName} className={primaryButtonClass}>
            {saving ? t('common.saving') : t('transport.assign')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const RouteCard = ({ view, onEdit, onDelete, onAddRider, onRemoveRider }) => {
  const { t, tx } = useI18n();
  const { route, students, riders } = view;
  const full = students >= route.capacity;
  const byStop = (route.stops ?? []).map((stop) => ({ stop, riders: riders.filter((r) => r.stopName === stop.name) }));
  const unmatched = riders.filter((r) => !(route.stops ?? []).some((s) => s.name === r.stopName));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#FF6B2C]" /> {route.name}
          </h3>
          <p className="text-xs text-slate-500">
            {route.vehicleNumber || t('transport.noVehicle')} · {formatCurrency(route.monthlyFee)}/{t('transport.month')}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {route.driverName && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {t('transport.driver')}: {route.driverName}
                {route.driverPhone ? ` (${route.driverPhone})` : ''}
              </span>
            )}
            {route.attendantName && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {t('transport.attendant')}: {route.attendantName}
                {route.attendantPhone ? ` (${route.attendantPhone})` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
              full ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> {students}/{route.capacity}
          </span>
          <button type="button" onClick={onEdit} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer" title={tx('Edit')}>
            <Pencil className="w-4 h-4" />
          </button>
          <button type="button" onClick={onDelete} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title={tx('Delete')}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ol className="divide-y divide-slate-100">
        {byStop.map(({ stop, riders: stopRiders }, index) => (
          <li key={stop.name} className="px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-50 text-[#FF6B2C] text-[11px] font-black flex items-center justify-center">
                  {index + 1}
                </span>
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {stop.name}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('transport.pickup')} {formatTime(stop.pickupTime)}
                </span>
                <span>
                  {t('transport.drop')} {formatTime(stop.dropTime)}
                </span>
              </p>
            </div>
            {stopRiders.length > 0 && <RiderChips riders={stopRiders} onRemove={onRemoveRider} />}
          </li>
        ))}
        {unmatched.length > 0 && (
          <li className="px-5 py-3">
            <p className="text-xs font-bold text-amber-700">{t('transport.unknownStop')}</p>
            <RiderChips riders={unmatched} onRemove={onRemoveRider} showStop />
          </li>
        )}
      </ol>

      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
        <button type="button" onClick={onAddRider} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B2C] cursor-pointer">
          <UserPlus className="w-4 h-4" /> {t('transport.assignStudent')}
        </button>
      </div>
    </div>
  );
};

const RiderChips = ({ riders, onRemove, showStop = false }) => (
  <div className="flex flex-wrap gap-1.5 mt-2 pl-8">
    {riders.map((r) => (
      <span
        key={r.id}
        className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700"
        title={r.since ? `Since ${formatDate(r.since)}` : undefined}
      >
        {r.studentName} <span className="text-slate-400">({r.className}{showStop ? ` · ${r.stopName}` : ''})</span>
        <button type="button" onClick={() => onRemove(r)} className="p-0.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label="Remove from bus">
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      </span>
    ))}
  </div>
);

/** /admin/transport — bus routes with stops, riders, and assigning students to a route and stop. */
export const TransportPage = () => {
  const { t } = useI18n();
  const routes = useApi('/transport/routes');
  const [editing, setEditing] = useState(null); // null | 'new' | route
  const [assigning, setAssigning] = useState(null); // null | {routeId}
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(null);

  const list = routes.data ?? [];
  const totalRiders = list.reduce((sum, r) => sum + r.students, 0);
  const totalSeats = list.reduce((sum, r) => sum + (r.route.capacity ?? 0), 0);

  return (
    <AdminPageShell
      activeItemId="transport"
      title={t('nav.transport')}
      description={t('transport.adminDescription')}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAssigning({})}
            disabled={list.length === 0}
            className={`${secondaryButtonClass} bg-white border border-slate-200`}
          >
            <UserPlus className="w-4 h-4" /> {t('transport.assignStudent')}
          </button>
          <button type="button" onClick={() => setEditing('new')} className={primaryButtonClass}>
            <Plus className="w-4 h-4" /> {t('transport.addRoute')}
          </button>
        </div>
      }
    >
      {routes.data && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            [t('transport.routes'), list.length],
            [t('transport.riders'), totalRiders],
            [t('transport.seatsFree'), Math.max(totalSeats - totalRiders, 0)],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      <AsyncState state={routes} loadingText={t('transport.loadingRoutes')}>
        {(views) =>
          views.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <EmptyMessage text={t('transport.noRoutes')} />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              {views.map((view) => (
                <RouteCard
                  key={view.route.id}
                  view={view}
                  onEdit={() => setEditing(view.route)}
                  onDelete={() => setDeleting(view)}
                  onAddRider={() => setAssigning({ routeId: view.route.id })}
                  onRemoveRider={setRemoving}
                />
              ))}
            </div>
          )
        }
      </AsyncState>

      {editing && (
        <RouteFormModal
          route={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            routes.reload();
          }}
        />
      )}
      {assigning && (
        <AssignModal
          routes={list}
          initialRouteId={assigning.routeId}
          onClose={() => setAssigning(null)}
          onSaved={() => {
            setAssigning(null);
            routes.reload();
          }}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title={t('transport.deleteRoute')}
        message={deleting?.route.name}
        detail={deleting?.students ? t('transport.deleteBlocked', { n: deleting.students }) : undefined}
        confirmLabel={t('common.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await http.delete(`/transport/routes/${encodeURIComponent(deleting.route.id)}`);
          setDeleting(null);
          routes.reload();
        }}
      />
      <ConfirmDialog
        isOpen={Boolean(removing)}
        title={t('transport.removeRider')}
        message={removing ? `${removing.studentName} (${removing.className}) — ${removing.stopName}` : ''}
        confirmLabel={t('common.remove')}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await http.delete(`/transport/assignments/${encodeURIComponent(removing.id)}`);
          setRemoving(null);
          routes.reload();
        }}
      />
    </AdminPageShell>
  );
};

export default TransportPage;
