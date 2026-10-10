import React from 'react';

const STYLES = {
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' },
  pending: { label: 'Pending', className: 'bg-[#FFF5F0] text-[#EA580C] border border-[#FF6B2C]/20' },
  overdue: { label: 'Overdue', className: 'bg-rose-50 text-rose-600 border border-rose-200' },
  none: { label: 'No dues', className: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

/** Fee status of a student: 'paid' | 'pending' | 'overdue' | 'none' (null while loading). */
export const StudentStatusBadge = ({ status }) => {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  const style = STYLES[status] || STYLES.none;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${style.className}`}>
      {style.label}
    </span>
  );
};
