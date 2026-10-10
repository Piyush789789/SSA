import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, GraduationCap, Loader2, Send } from 'lucide-react';
import { http } from '@/api/http';
import { APP_CONFIG } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { FormError, primaryButtonClass } from '@/components/common/Modal';
import { LanguageSwitch } from '@/components/common/LanguageSwitch';
import { EnquiryFields } from '@/components/admissions/EnquiryForm';
import { emptyEnquiry, enquiryBody, validateEnquiry } from '@/components/admissions/enquiryUtils';
import { useI18n } from '@/i18n/translate';

/** /admission-enquiry — public admission enquiry form (no login): POST /enquiries/public. */
export const AdmissionEnquiryPage = () => {
  const { t } = useI18n();
  const [form, setForm] = useState(emptyEnquiry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [thanks, setThanks] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateEnquiry(form, t);
    if (problem) return setError(problem);
    setSaving(true);
    setError('');
    try {
      // The website form always records the source as "Website" on the server.
      const result = await http.post('/enquiries/public', enquiryBody(form));
      setThanks({ id: result?.id, name: form.studentName.trim() });
      setForm(emptyEnquiry());
    } catch (err) {
      setError(err.status === 429 ? t('enquiry.tooMany') : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased">
      <header className="bg-gradient-to-br from-[#FF5C1B] via-[#FA6B2D] to-[#E04E15] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm sm:text-base leading-tight">{APP_CONFIG.schoolName}</p>
                <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">{t('enquiry.admissionsOpen')}</p>
              </div>
            </div>
            <LanguageSwitch className="bg-white/90" />
          </div>
          <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight">{t('enquiry.title')}</h1>
          <p className="mt-1 text-sm text-white/85 max-w-xl">{t('enquiry.subtitle')}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16 space-y-4">
        {thanks ? (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-xs p-6 sm:p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-extrabold text-slate-900">{t('enquiry.thanksTitle')}</h2>
            <p className="text-sm text-slate-600">{t('enquiry.thanksBody', { name: thanks.name })}</p>
            {thanks.id && (
              <p className="text-xs text-slate-500">
                {t('enquiry.reference')}: <strong className="font-mono">{thanks.id}</strong>
              </p>
            )}
            <button type="button" onClick={() => setThanks(null)} className="text-xs font-bold text-[#FF6B2C] hover:underline cursor-pointer">
              {t('enquiry.another')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-8 space-y-5">
            <EnquiryFields form={form} setForm={setForm} />
            <p className="text-[11px] text-slate-400">{t('enquiry.privacy')}</p>
            <FormError message={error} />
            <button type="submit" disabled={saving} className={`${primaryButtonClass} w-full`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? t('common.pleaseWait') : t('enquiry.submit')}
            </button>
          </form>
        )}
        <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
          <ChevronLeft className="w-4 h-4" /> {t('enquiry.backToLogin')}
        </Link>
      </main>
    </div>
  );
};

export default AdmissionEnquiryPage;
