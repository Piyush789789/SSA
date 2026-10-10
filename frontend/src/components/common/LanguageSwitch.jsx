import React from 'react';
import { Languages } from 'lucide-react';
import { LANGUAGES, useI18n } from '@/i18n/translate';

/** English / हिन्दी switch. The choice is saved in this browser. */
export const LanguageSwitch = ({ className = '' }) => {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t('common.language')}
      title={t('common.language')}
      className={`inline-flex items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-0.5 text-[11px] font-bold ${className}`}
    >
      <Languages className="w-3.5 h-3.5 text-slate-400 mx-1 hidden sm:block" aria-hidden="true" />
      {LANGUAGES.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setLang(option.id)}
          aria-pressed={lang === option.id}
          className={`rounded-xl px-2 py-1 cursor-pointer transition-colors ${
            lang === option.id ? 'bg-white text-[#FF6B2C] shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="hidden sm:inline">{option.label}</span>
          <span className="sm:hidden">{option.short}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitch;
