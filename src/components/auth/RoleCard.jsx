import React from 'react';

export const RoleCard = ({ role, isSelected, onSelect }) => {
  const Icon = role.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      className={`group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left w-full ${
        isSelected
          ? 'border-[#FF6B2C] bg-[#FFF8F5] ring-1 ring-[#FF6B2C]/30 shadow-xs'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
          isSelected
            ? 'bg-[#FF6B2C]/10 text-[#FF6B2C]'
            : role.colorClass || 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/60'
        }`}
      >
        <Icon className="w-4 h-4 stroke-[2.2]" />
      </div>

      <span
        className={`text-xs sm:text-sm font-semibold tracking-tight ${
          isSelected ? 'text-slate-900' : 'text-slate-700'
        }`}
      >
        {role.label}
      </span>
    </button>
  );
};
