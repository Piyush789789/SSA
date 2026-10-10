import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, LogOut, X } from 'lucide-react';
import { http } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/translate';

/** Same rule as the server: at least 8 characters with letters and numbers. */
const passwordProblem = (password) => {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Use both letters and numbers.';
  return null;
};

/** Current password + new password (twice). Calls onDone() after a successful change. */
export const ChangePasswordForm = ({ onDone, onCancel, submitLabel = 'Change password' }) => {
  const { refreshSession } = useAuth();
  const { tx } = useI18n();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = passwordProblem(next);
    if (problem) return setError(problem);
    if (next !== confirm) return setError('The two new passwords do not match.');
    setSaving(true);
    setError('');
    try {
      await http.post('/auth/change-password', { currentPassword: current, newPassword: next });
      await refreshSession();
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (label, value, setValue, autoComplete) => (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-700">{label}</span>
      <input
        type="password"
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-900 focus:border-[#FF6B2C] focus:outline-none"
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {field(tx('Current password'), current, setCurrent, 'current-password')}
      {field(tx('New password'), next, setNext, 'new-password')}
      {field(tx('Repeat new password'), confirm, setConfirm, 'new-password')}
      <p className="text-[11px] text-slate-500">At least 8 characters, with both letters and numbers.</p>
      {error ? (
        <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
            {tx('Cancel')}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#FF6B2C]/20 hover:bg-[#F25A1B] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {saving ? tx('Saving…') : tx(submitLabel)}
        </button>
      </div>
    </form>
  );
};

/** A "Change password" button that opens the form in a dialog. */
export const ChangePasswordButton = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const { tx } = useI18n();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#FF6B2C] hover:text-[#FF6B2C] ${className}`}
      >
        <KeyRound className="h-3.5 w-3.5" />
        {tx('Change password')}
      </button>
      {done ? (
        <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> {tx('Password changed')}
        </span>
      ) : null}
      <ChangePasswordModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onDone={() => {
          setOpen(false);
          setDone(true);
        }}
      />
    </>
  );
};

export const ChangePasswordModal = ({ isOpen, onClose, onDone }) => {
  const { tx } = useI18n();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">{tx('Change password')}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ChangePasswordForm onDone={onDone} onCancel={onClose} />
      </div>
    </div>
  );
};

/** Full page shown instead of the portal until a temporary password has been replaced. */
export const ForcedPasswordChange = () => {
  const { currentUser, logout } = useAuth();
  const { tx } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-1">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
            <KeyRound className="h-6 w-6 text-[#FF6B2C]" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{tx('Set your own password')}</h1>
          <p className="text-sm text-slate-500">
            Welcome{currentUser?.name ? `, ${currentUser.name}` : ''}. You signed in with a temporary password from the
            school office. Choose a new password to continue.
          </p>
        </div>
        <ChangePasswordForm submitLabel="Save and continue" />
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
        >
          <LogOut className="h-3.5 w-3.5" /> {tx('Sign out')}
        </button>
      </div>
    </div>
  );
};
