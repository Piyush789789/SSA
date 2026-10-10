import React, { useMemo, useState } from 'react';
import { BellRing, BookMarked, BookPlus, Loader2, Pencil, RefreshCw, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState } from '@/components/common/AsyncState';
import {
  FormError,
  FormField,
  FormSuccess,
  Modal,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/common/Modal';
import { StudentPicker } from '@/components/common/StudentPicker';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';
import { BookList, LibrarySearchBox, LoanList } from '@/components/library/LibraryParts';
import { useDebounced } from '@/components/library/libraryUtils';
import { useApi } from '@/hooks/useApi';
import { http, withQuery } from '@/api/http';
import { useI18n } from '@/i18n/translate';
import { formatCurrency, formatDate } from '@/utils';

const card = 'bg-white rounded-3xl border border-slate-200/80 shadow-xs';

const pillClass = (active) =>
  `rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
    active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
  }`;

const tabClass = (active) =>
  `rounded-xl px-4 py-2 text-xs font-bold border cursor-pointer ${
    active ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
  }`;

const smallButton =
  'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

/* ------------------------------------------------------------------ Catalogue */

const EMPTY_BOOK = { title: '', author: '', isbn: '', category: '', shelf: '', copies: 1 };

const BookFormModal = ({ book, onClose, onSaved }) => {
  const { t, tx } = useI18n();
  const isEdit = Boolean(book?.id);
  const [form, setForm] = useState(() => ({ ...EMPTY_BOOK, ...(book ?? {}) }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const copies = Number(form.copies);
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!Number.isInteger(copies) || copies < 1) {
      setError('Copies must be at least 1.');
      return;
    }
    const body = {
      title: form.title.trim(),
      author: form.author?.trim() || null,
      isbn: form.isbn?.trim() || null,
      category: form.category?.trim() || null,
      shelf: form.shelf?.trim() || null,
      copies,
    };
    setBusy(true);
    setError('');
    try {
      if (isEdit) await http.put(`/library/books/${book.id}`, body);
      else await http.post('/library/books', body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isEdit ? t('library.editBook') : t('library.addBook')}
      icon={BookPlus}
      onClose={onClose}
      busy={busy}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            {tx('Cancel')}
          </button>
          <button type="submit" form="library-book-form" disabled={busy} className={primaryButtonClass}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {tx('Save')}
          </button>
        </>
      }
    >
      <form id="library-book-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t('library.bookTitle')} required className="sm:col-span-2">
          <input className={fieldClass} value={form.title} onChange={set('title')} maxLength={200} autoFocus />
        </FormField>
        <FormField label={t('library.author')}>
          <input className={fieldClass} value={form.author ?? ''} onChange={set('author')} maxLength={120} />
        </FormField>
        <FormField label={t('library.isbn')}>
          <input className={fieldClass} value={form.isbn ?? ''} onChange={set('isbn')} maxLength={20} />
        </FormField>
        <FormField label={t('library.category')}>
          <input className={fieldClass} value={form.category ?? ''} onChange={set('category')} maxLength={60} />
        </FormField>
        <FormField label={t('library.shelf')}>
          <input className={fieldClass} value={form.shelf ?? ''} onChange={set('shelf')} maxLength={30} />
        </FormField>
        <FormField
          label={t('library.copies')}
          required
          hint={isEdit && book.copies != null ? `${t('library.available')}: ${book.available ?? 0}` : undefined}
        >
          <input type="number" min={1} className={fieldClass} value={form.copies} onChange={set('copies')} />
        </FormField>
        <div className="sm:col-span-2">
          <FormError message={error} />
        </div>
      </form>
    </Modal>
  );
};

const CatalogueTab = () => {
  const { t, tx } = useI18n();
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const books = useApi(withQuery('/library/books', { q }));
  const [editing, setEditing] = useState(null); // null | {} (new) | book
  const [deleting, setDeleting] = useState(null);

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 border-b border-slate-100">
        <LibrarySearchBox value={query} onChange={setQuery} placeholder={t('library.searchBooks')} />
        <button type="button" onClick={() => setEditing({})} className={primaryButtonClass}>
          <BookPlus className="w-4 h-4" />
          {t('library.addBook')}
        </button>
      </div>
      <AsyncState state={books}>
        {(list) => (
          <BookList
            books={list}
            renderActions={(book) => (
              <>
                <button type="button" onClick={() => setEditing(book)} className={smallButton}>
                  <Pencil className="w-3.5 h-3.5" />
                  {tx('Edit')}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(book)}
                  className={`${smallButton} text-rose-600 hover:bg-rose-50`}
                  aria-label={t('library.deleteBook')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {tx('Delete')}
                </button>
              </>
            )}
          />
        )}
      </AsyncState>

      {editing && (
        <BookFormModal
          book={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            books.reload();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title={t('library.deleteBook')}
        message={t('library.deleteConfirm')}
        detail={deleting ? `${deleting.title}${deleting.author ? ` — ${deleting.author}` : ''}` : null}
        confirmLabel={tx('Delete')}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await http.delete(`/library/books/${deleting.id}`);
          setDeleting(null);
          books.reload();
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ Issue */

const IssueTab = ({ onIssued }) => {
  const { t } = useI18n();
  const books = useApi('/library/books');
  const [bookFilter, setBookFilter] = useState('');
  const [bookId, setBookId] = useState('');
  const [borrowerType, setBorrowerType] = useState('student');
  const [student, setStudent] = useState(null);
  const [teacherId, setTeacherId] = useState('');
  const teachers = useApi(borrowerType === 'teacher' ? '/teachers' : null);
  const [days, setDays] = useState('14');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredBooks = useMemo(() => {
    const needle = bookFilter.trim().toLowerCase();
    const list = books.data ?? [];
    if (!needle) return list;
    return list.filter((b) =>
      [b.title, b.author, b.isbn, b.category].some((v) => v && String(v).toLowerCase().includes(needle)),
    );
  }, [books.data, bookFilter]);

  const selectedBook = (books.data ?? []).find((b) => String(b.id) === String(bookId));
  const borrowerId = borrowerType === 'student' ? student?.id : teacherId;
  const dayCount = Number(days);
  const daysValid = days === '' || (Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 60);
  const canSubmit = selectedBook && selectedBook.available > 0 && borrowerId && daysValid && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const body = { bookId: selectedBook.id, borrowerId };
      if (days !== '') body.days = dayCount;
      const issue = await http.post('/library/issues', body);
      setSuccess(
        t('library.issued', {
          title: issue?.bookTitle ?? selectedBook.title,
          name: issue?.borrowerName ?? (borrowerType === 'student' ? student?.name : borrowerId),
          due: formatDate(issue?.dueOn),
        }),
      );
      setBookId('');
      setStudent(null);
      setTeacherId('');
      books.reload();
      onIssued?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${card} p-5 sm:p-6 space-y-5 max-w-3xl`}>
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">{t('library.issueBook')}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{t('library.issueDescription')}</p>
      </div>

      <FormField label={t('library.book')} required>
        <AsyncState state={books}>
          {() => (
            <div className="space-y-2">
              <input
                type="search"
                value={bookFilter}
                onChange={(e) => setBookFilter(e.target.value)}
                placeholder={t('library.filterBooks')}
                className={fieldClass}
              />
              <select className={fieldClass} value={bookId} onChange={(e) => setBookId(e.target.value)}>
                <option value="">{t('library.chooseBook')}</option>
                {selectedBook && !filteredBooks.includes(selectedBook) && (
                  <option value={selectedBook.id}>{selectedBook.title}</option>
                )}
                {filteredBooks.map((b) => (
                  <option key={b.id} value={b.id} disabled={!b.available}>
                    {b.title}
                    {b.author ? ` — ${b.author}` : ''} ({t('library.availableOf', { available: b.available ?? 0, copies: b.copies ?? 0 })})
                  </option>
                ))}
              </select>
            </div>
          )}
        </AsyncState>
      </FormField>

      <div className="space-y-2">
        <span className="block text-xs font-bold text-slate-700">
          {t('library.borrower')} <span className="text-rose-500">*</span>
        </span>
        <div className="inline-flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
          {['student', 'teacher'].map((type) => (
            <button key={type} type="button" onClick={() => setBorrowerType(type)} className={pillClass(borrowerType === type)}>
              {t(`library.${type}`)}
            </button>
          ))}
        </div>
        {borrowerType === 'student' ? (
          <StudentPicker value={student} onChange={setStudent} />
        ) : (
          <AsyncState state={teachers}>
            {(list) => (
              <select className={fieldClass} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">{t('library.chooseTeacher')}</option>
                {(list ?? []).map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.id})
                  </option>
                ))}
              </select>
            )}
          </AsyncState>
        )}
      </div>

      <FormField label={t('library.days')} hint={t('library.daysHint')}>
        <input
          type="number"
          min={1}
          max={60}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className={`${fieldClass} max-w-[10rem]`}
        />
      </FormField>

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="flex justify-end">
        <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookMarked className="w-4 h-4" />}
          {t('library.issue')}
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------ Loans */

const STATUSES = ['open', 'overdue', 'returned', 'all'];
const STATUS_KEYS = { open: 'statusOpen', overdue: 'statusOverdue', returned: 'statusReturned', all: 'statusAll' };

const LoansTab = () => {
  const { t, tx } = useI18n();
  const [status, setStatus] = useState('open');
  const issues = useApi(withQuery('/library/issues', { status }));
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const act = async (issue, action) => {
    setBusyId(`${issue.id}:${action}`);
    setError('');
    setSuccess('');
    try {
      const result = await http.post(`/library/issues/${issue.id}/${action}`);
      const title = result?.bookTitle ?? issue.bookTitle;
      if (action === 'return') {
        setSuccess(
          result?.fine > 0
            ? t('library.returnedFine', { title, fine: formatCurrency(result.fine) })
            : t('library.returnedMsg', { title }),
        );
      } else {
        setSuccess(t('library.renewedMsg', { title, due: formatDate(result?.dueOn) }));
      }
      issues.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {STATUSES.map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)} className={pillClass(status === s)}>
              {t(`library.${STATUS_KEYS[s]}`)}
            </button>
          ))}
        </div>
        <button type="button" onClick={issues.reload} className={smallButton}>
          <RefreshCw className="w-3.5 h-3.5" />
          {tx('Refresh')}
        </button>
      </div>
      <FormError message={error} />
      <FormSuccess message={success} />
      <div className={`${card} overflow-hidden`}>
        <AsyncState state={issues}>
          {(list) => (
            <LoanList
              issues={list}
              showBorrower
              renderActions={(issue) =>
                issue.returnedOn ? null : (
                  <>
                    <button
                      type="button"
                      onClick={() => act(issue, 'renew')}
                      disabled={busyId != null}
                      className={smallButton}
                    >
                      {busyId === `${issue.id}:renew` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      {t('library.renew')}
                    </button>
                    <button
                      type="button"
                      onClick={() => act(issue, 'return')}
                      disabled={busyId != null}
                      className={`${smallButton} border-[#FF6B2C] text-[#FF6B2C] hover:bg-orange-50`}
                    >
                      {busyId === `${issue.id}:return` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Undo2 className="w-3.5 h-3.5" />
                      )}
                      {t('library.return')}
                    </button>
                  </>
                )
              }
            />
          )}
        </AsyncState>
      </div>
      <p className="text-[11px] text-slate-400">{t('library.finePolicy')}</p>
    </div>
  );
};

/* ------------------------------------------------------------------ Page */

const TABS = [
  { id: 'catalogue', key: 'library.tabCatalogue' },
  { id: 'issue', key: 'library.tabIssue' },
  { id: 'loans', key: 'library.tabLoans' },
];

/** /admin/library — catalogue, issuing, loans with return/renew, and overdue reminders. */
export const LibraryPage = () => {
  const { t } = useI18n();
  const [tab, setTab] = useState('catalogue');
  const [reminding, setReminding] = useState(false);
  const [remindResult, setRemindResult] = useState({ error: '', success: '' });

  const remind = async () => {
    setReminding(true);
    setRemindResult({ error: '', success: '' });
    try {
      const result = await http.post('/library/remind-overdue');
      setRemindResult({ error: '', success: t('library.remindersSent', { count: result?.reminded ?? 0 }) });
    } catch (err) {
      setRemindResult({ error: err.message, success: '' });
    } finally {
      setReminding(false);
    }
  };

  return (
    <AdminPageShell
      activeItemId="library"
      title={t('library.title')}
      description={t('library.adminDescription')}
      actions={
        <button type="button" onClick={remind} disabled={reminding} className={primaryButtonClass}>
          {reminding ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
          {t('library.remindOverdue')}
        </button>
      }
    >
      <FormError message={remindResult.error} />
      <FormSuccess message={remindResult.success} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={tabClass(tab === item.id)}>
            {t(item.key)}
          </button>
        ))}
      </div>

      {tab === 'catalogue' && <CatalogueTab />}
      {tab === 'issue' && <IssueTab />}
      {tab === 'loans' && <LoansTab />}
    </AdminPageShell>
  );
};

export default LibraryPage;
