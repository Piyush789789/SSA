import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Plain dialog frame in the app's style: backdrop, white card, title row with a close button.
 * `size`: 'md' (default), 'lg' or 'xl'. Escape closes it unless `busy`.
 */
export const Modal = ({ isOpen = true, title, subtitle, icon, onClose, busy = false, size = 'md', children, footer }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;
  const Icon = icon;
  const width = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className={`bg-white rounded-3xl ${width} w-full shadow-2xl border border-slate-100 my-8`} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 space-y-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-3 px-5 sm:px-6 pb-5 sm:pb-6">{footer}</div>}
      </div>
    </div>
  );
};

/** Shared form styles for the batch-3 pages. */
export const fieldClass =
  'w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#FF6B2C] focus:bg-white focus:outline-none';
export const textAreaClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:border-[#FF6B2C] focus:bg-white focus:outline-none';
export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B2C] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-[#FF6B2C]/20';
export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60 cursor-pointer';

/** Labelled form field. */
export const FormField = ({ label, required, hint, className = '', children }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-xs font-bold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
  </label>
);

/** Red error line used inside forms and dialogs. */
export const FormError = ({ message }) =>
  message ? (
    <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{message}</p>
  ) : null;

/** Green success line. */
export const FormSuccess = ({ message }) =>
  message ? (
    <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</p>
  ) : null;

export default Modal;
