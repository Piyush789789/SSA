import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const p = (priority || 'medium').toLowerCase();

  if (p === 'high') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
        high
      </span>
    );
  }

  if (p === 'low') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        low
      </span>
    );
  }

  // Medium (Default)
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      medium
    </span>
  );
};

export const PriorityIcon = ({ priority }) => {
  const p = (priority || 'medium').toLowerCase();

  if (p === 'high') {
    return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />;
  }

  if (p === 'low') {
    return <Info className="w-5 h-5 text-slate-400 shrink-0" />;
  }

  return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
};
