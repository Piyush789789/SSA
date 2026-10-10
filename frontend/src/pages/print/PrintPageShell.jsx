import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { HOME_BY_ROLE } from '@/routes/RequireRole';
import { PrintButton } from '@/components/common/PrintButton';
import { useI18n } from '@/i18n/translate';

/** Bare page for printable sheets: a small toolbar (hidden when printing) above the sheet. */
export const PrintPageShell = ({ title, children }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { tx } = useI18n();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(HOME_BY_ROLE[currentUser?.role] ?? '/');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased">
      <div className="no-print sticky top-0 z-30 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {tx('Back')}
          </button>
          <p className="hidden sm:block text-sm font-extrabold text-slate-800 truncate">{tx(title)}</p>
          <PrintButton />
        </div>
      </div>
      <main className="max-w-4xl mx-auto p-4 sm:p-6 pb-16">{children}</main>
    </div>
  );
};

export default PrintPageShell;
