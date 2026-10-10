import React from 'react';
import { useI18n } from '@/i18n/translate';

/**
 * Title row for portal pages (teacher, student, parent): icon + title, a description and optional actions.
 * The title is translated when the dictionaries know it.
 */
export const PageHeader = ({ icon, title, description, actions }) => {
  const { tx } = useI18n();
  const Icon = icon;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          {Icon && <Icon className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />}
          <span>{tx(title)}</span>
        </h1>
        {description && <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{description}</p>}
      </div>
      {actions}
    </div>
  );
};

export default PageHeader;
