import React from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '@/i18n/translate';
import { datedFileName, downloadCsv } from '@/utils/csv';

/** "Export to Excel" button: downloads `rows` as a CSV file named `<fileBase>-<date>.csv`. */
export const ExportButton = ({ rows, columns, fileBase, className = '' }) => {
  const { t } = useI18n();
  const empty = !rows || rows.length === 0;
  return (
    <button
      type="button"
      disabled={empty}
      onClick={() => downloadCsv(datedFileName(fileBase), rows, columns)}
      title={t('common.exportHint')}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>{t('common.exportExcel')}</span>
    </button>
  );
};
