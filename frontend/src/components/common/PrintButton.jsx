import React from 'react';
import { Printer } from 'lucide-react';
import { useI18n } from '@/i18n/translate';

/** "Print" button for pages that show a `.print-sheet`; hidden in the printout itself. */
export const PrintButton = ({ label = 'Print', disabled = false, className = '' }) => {
  const { tx } = useI18n();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      disabled={disabled}
      className={`no-print inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Printer className="w-4 h-4 stroke-[2]" />
      <span>{tx(label)}</span>
    </button>
  );
};

export default PrintButton;
