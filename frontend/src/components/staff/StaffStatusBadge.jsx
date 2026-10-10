import React from 'react';
import { STAFF_STATUS_LABELS, STAFF_STATUS_STYLES } from './staffStatus';

export const StaffStatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${
      STAFF_STATUS_STYLES[status] ?? 'bg-slate-50 text-slate-500 border-slate-200'
    }`}
  >
    {STAFF_STATUS_LABELS[status] ?? 'Not marked'}
  </span>
);

export default StaffStatusBadge;
