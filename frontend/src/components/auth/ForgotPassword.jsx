import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, Loader2 } from 'lucide-react';
import { Modal, fieldClass, primaryButtonClass } from '@/components/common/Modal';
import { http } from '@/api/http';
import { useI18n } from '@/i18n/translate';

/**
 * "Forgot password?" on the login page. There is no SMS/email reset (that costs money): the request notifies the
 * school's admins, who reset the password in Logins & Parents and give the person a new one.
 */
export const ForgotPasswordLink = ({ initialLogin = '' }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const show = () => {
    setLoginId(initialLogin);
    setDone('');
    setError('');
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    // React events bubble through portals: without this the login form around the link would submit too.
    e.stopPropagation();
    if (!loginId.trim()) {
      setError(t('forgot.enterLogin'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await http.post('/auth/forgot-password', { loginId: loginId.trim() });
      setDone(t('forgot.sent'));
    } catch (err) {
      setError(err.message || t('forgot.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={show} className="text-xs font-semibold text-[#FF6B2C] hover:underline cursor-pointer">
        {t('forgot.link')}
      </button>
      {/* Portal: the link sits inside the login <form>, and a form inside a form is not allowed in HTML. */}
      {open && createPortal(
        <Modal title={t('forgot.title')} icon={KeyRound} onClose={() => setOpen(false)} busy={busy}>
          {done ? (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">{done}</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-xs text-slate-500">{t('forgot.explain')}</p>
              <div>
                <label htmlFor="forgot-login" className="text-xs font-bold text-slate-500">
                  {t('forgot.loginLabel')}
                </label>
                <input
                  id="forgot-login"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="student@ssa.edu / STU-2026-0503"
                  className={`${fieldClass} mt-1`}
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('forgot.submit')}
              </button>
            </form>
          )}
        </Modal>,
        document.body,
      )}
    </>
  );
};
