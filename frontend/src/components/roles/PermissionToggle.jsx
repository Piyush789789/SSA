import React from 'react';

export const PermissionToggle = ({ permission, isChecked, onToggle }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onToggle(permission.id);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(permission.id);
        }
      }}
      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer select-none ${
        isChecked
          ? 'bg-[#FFF5F0]/70 border-[#FF6B2C]/30 shadow-2xs'
          : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <span className="text-xs sm:text-sm font-semibold text-slate-900 pr-2">
        {permission.label}
      </span>

      {/* Switch Toggle */}
      <button
        type="button"
        aria-label={`Toggle ${permission.label} permission`}
        aria-checked={isChecked}
        role="switch"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(permission.id);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B2C] focus-visible:ring-opacity-75 ${
          isChecked ? 'bg-[#FF6B2C]' : 'bg-slate-200'
        }`}
      >
        <span className="sr-only">Toggle {permission.label}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isChecked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
