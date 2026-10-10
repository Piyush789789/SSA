import React from 'react';
import { BookOpen, Search } from 'lucide-react';
import { EmptyMessage } from '@/components/common/AsyncState';
import { useI18n } from '@/i18n/translate';
import { formatCurrency, formatDate } from '@/utils';
import { daysLate, isOverdue } from './libraryUtils';

/** Search input with a magnifier icon. */
export const LibrarySearchBox = ({ value, onChange, placeholder }) => (
  <div className="relative w-full sm:max-w-sm">
    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 focus:border-[#FF6B2C] focus:outline-none"
    />
  </div>
);

/** Availability pill: green when copies are on the shelf, red when all are out. */
export const AvailabilityBadge = ({ book }) => {
  const { t } = useI18n();
  const none = !book.available;
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-bold whitespace-nowrap ${
        none ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {t('library.availableOf', { available: book.available ?? 0, copies: book.copies ?? 0 })}
    </span>
  );
};

/** Catalogue list. `renderActions(book)` adds buttons at the end of each row. */
export const BookList = ({ books, renderActions }) => {
  const { t } = useI18n();
  if (!books?.length) return <EmptyMessage text={t('library.noBooks')} />;
  return (
    <ul className="divide-y divide-slate-100">
      {books.map((book) => (
        <li key={book.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{book.title}</p>
              <p className="text-xs text-slate-500">
                {book.author || '—'}
                {book.isbn ? ` · ISBN ${book.isbn}` : ''}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {book.category ? `${t('library.category')}: ${book.category}` : ''}
                {book.category && book.shelf ? ' · ' : ''}
                {book.shelf ? `${t('library.shelf')}: ${book.shelf}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:justify-end flex-wrap">
            <AvailabilityBadge book={book} />
            {renderActions?.(book)}
          </div>
        </li>
      ))}
    </ul>
  );
};

/** Status chip of a loan: returned (muted), overdue (red, days late) or open. */
export const LoanStatus = ({ issue }) => {
  const { t } = useI18n();
  if (issue.returnedOn) {
    return (
      <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
        {t('library.statusReturned')}
      </span>
    );
  }
  if (isOverdue(issue)) {
    return (
      <span className="inline-flex rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600">
        {t('library.statusOverdue')} · {t('library.daysLate', { days: daysLate(issue) })}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700">
      {t('library.statusOpen')}
    </span>
  );
};

/**
 * Loans list. `showBorrower` adds the borrower's name, type and class; `renderActions(issue)` adds buttons.
 * Overdue rows are tinted red and returned rows are muted.
 */
export const LoanList = ({ issues, showBorrower = false, renderActions, emptyText }) => {
  const { t } = useI18n();
  if (!issues?.length) return <EmptyMessage text={emptyText ?? t('library.noLoans')} />;
  return (
    <ul className="divide-y divide-slate-100">
      {issues.map((issue) => {
        const overdue = isOverdue(issue);
        const returned = Boolean(issue.returnedOn);
        const late = daysLate(issue);
        return (
          <li
            key={issue.id}
            className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5 ${
              overdue ? 'bg-rose-50/50' : returned ? 'opacity-70' : ''
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm font-bold ${overdue ? 'text-rose-700' : 'text-slate-900'}`}>{issue.bookTitle}</p>
                <LoanStatus issue={issue} />
              </div>
              {showBorrower && (
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{issue.borrowerName}</span>
                  {issue.borrowerType ? ` · ${issue.borrowerType}` : ''}
                  {issue.className ? ` · Class ${issue.className}` : ''}
                  {issue.borrowerId ? <span className="text-slate-400"> · {issue.borrowerId}</span> : null}
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                {t('library.issuedOn')}: {formatDate(issue.issuedOn)}
                {' · '}
                <span className={overdue ? 'font-bold text-rose-600' : ''}>
                  {t('library.dueOn')}: {formatDate(issue.dueOn)}
                </span>
                {returned && (
                  <>
                    {' · '}
                    {t('library.returnedOn')}: {formatDate(issue.returnedOn)}
                    {late > 0 ? ` (${t('library.daysLate', { days: late })})` : ''}
                  </>
                )}
              </p>
              {issue.fine > 0 && (
                <p className="text-[11px] font-bold text-rose-600">
                  {t('library.fine')}: {formatCurrency(issue.fine)}
                </p>
              )}
            </div>
            {renderActions && <div className="flex items-center gap-2 sm:justify-end">{renderActions(issue)}</div>}
          </li>
        );
      })}
    </ul>
  );
};
