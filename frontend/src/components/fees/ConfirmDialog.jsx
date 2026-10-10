import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Generic "are you sure?" dialog. `onConfirm(note)` may be async; while it runs the buttons are disabled and
 * a thrown error's message is shown inside the dialog. Set `withNote` to ask for an optional note.
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  detail,
  confirmLabel = 'Confirm',
  tone = 'danger',
  withNote = false,
  notePlaceholder = 'Optional note',
  onClose,
  onConfirm,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBusy(false);
      setError('');
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm(note.trim());
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  const confirmClass =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 pr-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {message && <p className="text-xs text-slate-500 mt-0.5">{message}</p>}
          </div>
        </div>

        {detail && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-700 font-medium">
            {detail}
          </div>
        )}

        {withNote && (
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={notePlaceholder}
            className="w-full px-4 py-2.5 rounded-2xl text-xs border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none"
          />
        )}

        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`px-5 py-2.5 text-white font-semibold text-xs rounded-2xl shadow-md transition-colors cursor-pointer disabled:opacity-60 ${confirmClass}`}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
