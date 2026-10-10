import React from 'react';
import { Bus, Clock, MapPin, Phone, User } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate } from '@/utils';
import { useI18n } from '@/i18n/translate';
import { formatTime } from './time';

const CallLink = ({ role, name, phone }) => {
  if (!name && !phone) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{role}</p>
          <p className="text-xs font-bold text-slate-800 truncate">{name || '—'}</p>
        </div>
      </div>
      {phone && (
        <a
          href={`tel:${phone.replace(/[^+\d]/g, '')}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white shrink-0"
        >
          <Phone className="w-3.5 h-3.5" /> {phone}
        </a>
      )}
    </div>
  );
};

/**
 * "My bus" card for a student (GET /transport/students/{id}): route, stop, pick-up / drop times, vehicle, and the
 * driver and attendant with tap-to-call. With `hideWhenNone` nothing is shown when the student has no bus.
 */
export const MyBusCard = ({ studentId, hideWhenNone = false }) => {
  const { t } = useI18n();
  const transport = useApi(studentId ? `/transport/students/${encodeURIComponent(studentId)}` : null);

  if (!studentId) return null;
  if (hideWhenNone && (transport.loading || transport.error || !transport.data)) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
        <Bus className="w-5 h-5 text-[#FF6B2C]" />
        <span>{t('nav.myBus')}</span>
      </h2>
      <AsyncState state={transport} loadingText={t('transport.loadingBus')}>
        {(info) => {
          if (!info || !info.route) return <EmptyMessage text={t('transport.noBus')} />;
          const { route, stop, assignment } = info;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="rounded-2xl bg-gradient-to-br from-[#FF7A45] to-[#E04E15] text-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{t('transport.route')}</p>
                  <p className="text-lg font-black">{route.name}</p>
                  {route.vehicleNumber && (
                    <p className="text-xs font-semibold text-white/90 mt-1">
                      {t('transport.vehicle')}: {route.vehicleNumber}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF6B2C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('transport.stop')}</p>
                    <p className="text-sm font-bold text-slate-900">{stop?.name ?? assignment?.stopName ?? '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t('transport.pickup')}
                    </p>
                    <p className="text-base font-black text-slate-900">{formatTime(stop?.pickupTime)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t('transport.drop')}
                    </p>
                    <p className="text-base font-black text-slate-900">{formatTime(stop?.dropTime)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <CallLink role={t('transport.driver')} name={route.driverName} phone={route.driverPhone} />
                <CallLink role={t('transport.attendant')} name={route.attendantName} phone={route.attendantPhone} />
                {assignment?.since && (
                  <p className="text-[11px] text-slate-400">
                    {t('transport.since')} {formatDate(assignment.since)}
                  </p>
                )}
              </div>
            </div>
          );
        }}
      </AsyncState>
    </div>
  );
};

export default MyBusCard;
