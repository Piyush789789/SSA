import React from 'react';

export const StudentStatusBadge = ({ status }) => {
  const isPaid = status === 'paid';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
        isPaid
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
          : 'bg-[#FFF5F0] text-[#EA580C] border border-[#FF6B2C]/20'
      }`}
    >
      {status}
    </span>
  );
};
