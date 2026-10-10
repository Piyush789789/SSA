import React, { useState } from 'react';
import { BookMarked } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { PageHeader } from '@/components/common/PageHeader';
import { BookList, LibrarySearchBox, LoanList } from '@/components/library/LibraryParts';
import { useDebounced } from '@/components/library/libraryUtils';
import { useI18n } from '@/i18n/translate';

const card = 'bg-white rounded-3xl border border-slate-200/80 shadow-xs';

/** Open loans first (overdue earliest), then returned ones, newest first. */
const sortLoans = (list) =>
  [...(list ?? [])].sort((a, b) => {
    if (!a.returnedOn !== !b.returnedOn) return a.returnedOn ? 1 : -1;
    if (!a.returnedOn) return String(a.dueOn).localeCompare(String(b.dueOn));
    return String(b.returnedOn).localeCompare(String(a.returnedOn));
  });

/** /student/library, /parent/library, /teacher/library — my loans (or the selected child's) and catalogue search. */
export const MyLibraryPage = () => {
  const { t } = useI18n();
  const { role, selectedChild } = useAuth();
  const isParent = role === 'parent';
  const childId = selectedChild?.studentId;

  const loansPath = isParent ? (childId ? withQuery('/library/my-loans', { studentId: childId }) : null) : '/library/my-loans';
  const loans = useApi(loansPath);

  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const books = useApi(withQuery('/library/books', { q }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon={BookMarked}
        title={t('library.title')}
        description={
          isParent && selectedChild
            ? t('library.childDescription', { name: selectedChild.name })
            : t('library.myDescription')
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className={`lg:col-span-5 ${card} overflow-hidden`}>
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {isParent && selectedChild ? t('library.childLoans', { name: selectedChild.name }) : t('library.myLoans')}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('library.finePolicy')}</p>
          </div>
          {isParent && !childId ? (
            <EmptyMessage text={t('library.noChild')} />
          ) : (
            <AsyncState state={loans}>
              {(list) => <LoanList issues={sortLoans(list)} emptyText={t('library.noMyLoans')} />}
            </AsyncState>
          )}
        </section>

        <section className={`lg:col-span-7 ${card} overflow-hidden`}>
          <div className="flex flex-col gap-3 p-5 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('library.catalogue')}</h2>
            <LibrarySearchBox value={query} onChange={setQuery} placeholder={t('library.searchBooks')} />
          </div>
          <AsyncState state={books}>{(list) => <BookList books={list} />}</AsyncState>
        </section>
      </div>
    </div>
  );
};

export default MyLibraryPage;
