import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const UnsavedChangesModal = ({ isOpen, onStay, onDiscard }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          type="button"
          onClick={onStay}
          aria-label="Close"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Unsaved Changes</h3>
          </div>
        </div>

        <p className="text-slate-600 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
          You have unsaved permission changes. Switching teachers now will discard your modifications.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onStay}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};
