import React, { useMemo } from 'react';
import { UserPlus, UserCheck, CreditCard, Bell, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';

const getActivityIcon = (type) => {
  switch (type) {
    case 'enrollment':
      return { icon: UserPlus, bg: 'bg-orange-100 text-orange-600' };
    case 'teacher':
      return { icon: UserCheck, bg: 'bg-indigo-100 text-indigo-600' };
    case 'fee':
      return { icon: CreditCard, bg: 'bg-emerald-100 text-emerald-600' };
    case 'notice':
      return { icon: Bell, bg: 'bg-amber-100 text-amber-600' };
    case 'attendance':
    default:
      return { icon: CheckCircle2, bg: 'bg-cyan-100 text-cyan-600' };
  }
};

/** Latest fee payments (GET /fees/payments) and notices (GET /notices), newest first. */
export const RecentActivity = ({ payments = [], notices = [], limit = 6 }) => {
  const activities = useMemo(() => {
    const items = [
      ...payments.map((p) => ({
        id: `pay-${p.id}`,
        type: 'fee',
        title: `${formatCurrency(p.amount)} fee received`,
        subtitle: `${p.studentName} (${p.className}) · ${p.feeTitle}`,
        sortKey: String(p.paidAt),
        time: formatDateTime(p.paidAt),
      })),
      ...notices.map((n) => ({
        id: `notice-${n.id}`,
        type: 'notice',
        title: n.title,
        subtitle: `Notice by ${n.authorName || 'School'}`,
        sortKey: String(n.updatedAt || n.createdAt),
        time: formatDate(n.updatedAt || n.createdAt),
      })),
    ];
    return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, limit);
  }, [payments, notices, limit]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Recent Activity
          </h3>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium py-6 text-center">No recent activity.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const { icon: Icon, bg } = getActivityIcon(activity.type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 leading-snug truncate">
                      {activity.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{activity.subtitle}</div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">{activity.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
        Fee payments and notices
      </div>
    </div>
  );
};
