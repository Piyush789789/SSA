import React from 'react';
import { ChevronLeft, SearchX } from 'lucide-react';

/** Shown when the record in the URL (student, class, ...) does not exist. */
export const NotFoundCard = ({ title, message, backLabel, onBack }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 p-10 shadow-xs text-center space-y-3">
    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
      <SearchX className="w-6 h-6" />
    </div>
    <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
    <p className="text-sm text-slate-500">{message}</p>
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B2C] text-white text-xs font-bold rounded-2xl cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> {backLabel}
      </button>
    )}
  </div>
);
