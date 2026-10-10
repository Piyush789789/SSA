import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const DeleteNoticeModal = ({ isOpen, notice, onClose, onConfirm }) => {
  if (!isOpen || !notice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Heading */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Delete Notice?</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Are you sure you want to delete this notice? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Preview of Notice Title */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-semibold text-slate-800">
          "{notice.title}"
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notice.id)}
            aria-label="Delete notice"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-2xl shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
          >
            Delete Notice
          </button>
        </div>
      </div>
    </div>
  );
};
