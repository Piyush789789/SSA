import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  GraduationCap,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import {
  FormError,
  FormField,
  Modal,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textAreaClass,
} from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';
import { EnquiryFields } from '@/components/admissions/EnquiryForm';
import {
  STATUSES,
  emptyEnquiry,
  enquiryBody,
  enquiryToForm,
  validateEnquiry,
} from '@/components/admissions/enquiryUtils';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatDateTime, todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';

const STATUS_STYLES = {
  NEW: 'bg-sky-50 text-sky-700 border-sky-200',
  CONTACTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  VISITED: 'bg-violet-50 text-violet-700 border-violet-200',
  APPLIED: 'bg-amber-50 text-amber-700 border-amber-200',
  ADMITTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-500 border-slate-200',
};
const FOLLOW_UPS = 'FOLLOW_UPS';
const isOpen = (e) => e.status !== 'ADMITTED' && e.status !== 'CLOSED';
const isDue = (e) => isOpen(e) && e.followUpDate && e.followUpDate <= todayIso();

const StatusChip = ({ status }) => {
  const { t } = useI18n();
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${STATUS_STYLES[status] ?? STATUS_STYLES.CLOSED}`}>
      {t(`admissions.status.${status}`, null, status)}
    </span>
  );
};

/** Add (POST /enquiries) or edit (PUT /enquiries/{id}) an enquiry. */
const EnquiryModal = ({ enquiry, onClose, onSaved }) => {
  const { t } = useI18n();
  const [form, setForm] = useState(() => (enquiry ? enquiryToForm(enquiry) : emptyEnquiry()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateEnquiry(form, t);
    if (problem) return setError(problem);
    setSaving(true);
    setError('');
    try {
      if (enquiry) {
        // The PUT replaces the details; keep the pipeline fields as they are.
        await http.put(
          `/enquiries/${encodeURIComponent(enquiry.id)}`,
          enquiryBody(form, { source: form.source || null, status: enquiry.status, followUpDate: enquiry.followUpDate ?? null }),
        );
      } else {
        await http.post('/enquiries', enquiryBody(form, { source: form.source || null }));
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={enquiry ? t('admissions.editEnquiry') : t('admissions.addEnquiry')}
      subtitle={enquiry ? undefined : t('admissions.addSubtitle')}
      icon={UserPlus}
      size="lg"
      busy={saving}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <EnquiryFields form={form} setForm={setForm} withSource />
        <FormError message={error} />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/** Move an enquiry along the pipeline (POST /enquiries/{id}/status). ADMITTED goes through "Admit". */
const StatusModal = ({ enquiry, onClose, onSaved }) => {
  const { t } = useI18n();
  const [status, setStatus] = useState(enquiry.status === 'NEW' ? 'CONTACTED' : enquiry.status);
  const [followUpDate, setFollowUpDate] = useState(enquiry.followUpDate ?? '');
  const [notes, setNotes] = useState(enquiry.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await http.post(`/enquiries/${encodeURIComponent(enquiry.id)}/status`, {
        status,
        followUpDate: followUpDate || null,
        notes: notes.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={t('admissions.changeStatus')} subtitle={`${enquiry.studentName} · ${enquiry.parentName}`} icon={RefreshCw} busy={saving} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {/* A group, not a FormField <label>: a click on the label's empty space would press the first button (New). */}
        <div role="group" aria-label={t('common.status')}>
          <span className="mb-1 block text-xs font-bold text-slate-700">{t('common.status')}</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.filter((s) => s !== 'ADMITTED').map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold border cursor-pointer ${
                  status === s ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                {t(`admissions.status.${s}`)}
              </button>
            ))}
          </div>
        </div>
        <FormField label={t('admissions.followUp')} hint={t('admissions.followUpHint')}>
          <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={fieldClass} />
        </FormField>
        <FormField label={t('admissions.notes')}>
          <textarea rows={4} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('admissions.notesPlaceholder')} className={textAreaClass} />
        </FormField>
        <FormError message={error} />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/** Admit: creates the student (and parent) from the enquiry and shows the one-time passwords. */
const AdmitModal = ({ enquiry, classes, onClose, onAdmitted }) => {
  const { t } = useI18n();
  const matching = classes.filter((c) => String(c.grade) === String(enquiry.classSought).replace(/^class\s*/i, ''));
  const [className, setClassName] = useState(matching[0]?.id ?? '');
  const [rollNumber, setRollNumber] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Father');
  const [createLogins, setCreateLogins] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!className) return setError(t('admissions.errChooseClass'));
    setSaving(true);
    setError('');
    try {
      const res = await http.post(`/enquiries/${encodeURIComponent(enquiry.id)}/admit`, {
        className,
        rollNumber: rollNumber ? Number(rollNumber) : null,
        guardianRelation,
        createLogins,
      });
      setResult(res);
      onAdmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <Modal title={t('admissions.admitted')} subtitle={enquiry.studentName} icon={UserCheck} size="lg" onClose={onClose}>
        <p className="text-sm text-slate-700">
          {t('admissions.admittedAs')} <strong>{result.studentId}</strong>.
        </p>
        {result.logins?.length > 0 ? (
          <>
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {t('admissions.passwordsOnce')}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">{t('admissions.name')}</th>
                    <th className="text-left px-3 py-2 font-bold">{t('admissions.loginId')}</th>
                    <th className="text-left px-3 py-2 font-bold">{t('admissions.tempPassword')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.logins.map((l) => (
                    <tr key={l.loginId}>
                      <td className="px-3 py-2 font-semibold text-slate-800">{l.name}</td>
                      <td className="px-3 py-2 font-mono">{l.loginId}</td>
                      <td className="px-3 py-2 font-mono font-bold text-[#FF6B2C]">{l.temporaryPassword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">{t('admissions.noLogins')}</p>
        )}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Link to={`/admin/students/${encodeURIComponent(result.studentId)}`} className={secondaryButtonClass}>
            <ExternalLink className="w-4 h-4" /> {t('admissions.openProfile')}
          </Link>
          <button type="button" onClick={onClose} className={primaryButtonClass}>
            {t('common.close')}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={t('admissions.admit')} subtitle={`${enquiry.studentName} — ${t('admissions.classSought')}: ${enquiry.classSought}`} icon={GraduationCap} busy={saving} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('common.class')} required>
            <select value={className} onChange={(e) => setClassName(e.target.value)} className={`${fieldClass} cursor-pointer`}>
              <option value="">{t('admissions.chooseClass')}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} ({c.studentCount ?? 0})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('admissions.roll')} hint={t('admissions.rollHint')}>
            <input type="number" min="1" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="Auto" className={fieldClass} />
          </FormField>
        </div>
        <FormField label={t('admissions.relation')} hint={`${enquiry.parentName} · ${enquiry.phone}`}>
          <select value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)} className={`${fieldClass} cursor-pointer`}>
            {['Father', 'Mother', 'Guardian', 'Other'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </FormField>
        <label className="flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3 cursor-pointer">
          <input type="checkbox" checked={createLogins} onChange={(e) => setCreateLogins(e.target.checked)} className="mt-0.5 accent-[#FF6B2C]" />
          <span>
            <span className="block text-xs font-bold text-slate-800">{t('admissions.createLogins')}</span>
            <span className="block text-[11px] text-slate-500">{t('admissions.createLoginsHint')}</span>
          </span>
        </label>
        <FormError message={error} />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            <UserCheck className="w-4 h-4" /> {saving ? t('common.pleaseWait') : t('admissions.admit')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const EnquiryRow = ({ enquiry: e, onStatus, onAdmit, onEdit, onDelete }) => {
  const { t, tx } = useI18n();
  const due = isDue(e);
  return (
    <li className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start gap-3">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-extrabold text-slate-900">{e.studentName}</p>
          <StatusChip status={e.status} />
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
            {t('admissions.for')} {/^\d+$/.test(e.classSought) ? `${t('common.class')} ${e.classSought}` : e.classSought}
          </span>
          {e.source && <span className="text-[11px] text-slate-400">· {e.source}</span>}
        </div>
        <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{e.parentName}</span>
          <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 font-semibold text-[#FF6B2C]">
            <Phone className="w-3.5 h-3.5" /> {e.phone}
          </a>
          {e.email && <span>{e.email}</span>}
          {e.dateOfBirth && <span>DOB {formatDate(e.dateOfBirth)}</span>}
          {e.previousSchool && <span>{t('admissions.previousSchool')}: {e.previousSchool}</span>}
        </p>
        {e.notes && <p className="text-xs text-slate-500 whitespace-pre-line line-clamp-3">{e.notes}</p>}
        <p className="text-[11px] text-slate-400 flex flex-wrap gap-x-3">
          <span>{t('admissions.received')} {formatDateTime(e.createdAt)}</span>
          {e.followUpDate && isOpen(e) && (
            <span className={`inline-flex items-center gap-1 font-bold ${due ? 'text-rose-600' : 'text-slate-500'}`}>
              <CalendarClock className="w-3.5 h-3.5" /> {t('admissions.followUp')}: {formatDate(e.followUpDate)}
            </span>
          )}
          {e.admittedStudentId && (
            <Link to={`/admin/students/${encodeURIComponent(e.admittedStudentId)}`} className="font-bold text-emerald-700 hover:underline">
              {e.admittedStudentId}
            </Link>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {!e.admittedStudentId && (
          <>
            <button type="button" onClick={onStatus} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300 cursor-pointer">
              {t('admissions.changeStatus')}
            </button>
            <button type="button" onClick={onAdmit} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
              <UserCheck className="w-3.5 h-3.5" /> {t('admissions.admit')}
            </button>
          </>
        )}
        <button type="button" onClick={onEdit} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer" title={tx('Edit')}>
          <Pencil className="w-4 h-4" />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title={tx('Delete')}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
};

/** /admin/admissions — the enquiry → admission pipeline. */
export const AdmissionsPage = () => {
  const { t } = useI18n();
  const [tab, setTab] = useState('NEW');
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const stats = useApi('/enquiries/stats');
  const enquiries = useApi(withQuery('/enquiries', { status: tab === FOLLOW_UPS || tab === 'ALL' ? '' : tab, q }));
  const classes = useApi('/classes');
  const [editing, setEditing] = useState(null); // 'new' | enquiry
  const [statusFor, setStatusFor] = useState(null);
  const [admitting, setAdmitting] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const reloadAll = () => {
    enquiries.reload();
    stats.reload();
  };

  const shown = useMemo(() => {
    const list = enquiries.data ?? [];
    if (tab !== FOLLOW_UPS) return list;
    return list.filter(isDue).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  }, [enquiries.data, tab]);

  const s = stats.data;
  const openCount = s ? ['NEW', 'CONTACTED', 'VISITED', 'APPLIED'].reduce((sum, k) => sum + (s.byStatus?.[k] ?? 0), 0) : null;
  const total = s ? Object.values(s.byStatus ?? {}).reduce((a, b) => a + b, 0) : null;

  const TABS = [
    { id: FOLLOW_UPS, label: t('admissions.followUpsDue'), count: s?.followUpsDue, warn: true },
    ...STATUSES.map((id) => ({ id, label: t(`admissions.status.${id}`), count: s?.byStatus?.[id] })),
    { id: 'ALL', label: t('common.all'), count: total },
  ];

  return (
    <AdminPageShell
      activeItemId="admissions"
      title={t('nav.admissions')}
      description={t('admissions.description')}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/admission-enquiry" target="_blank" className={`${secondaryButtonClass} bg-white border border-slate-200`}>
            <ExternalLink className="w-4 h-4" /> {t('admissions.publicForm')}
          </Link>
          <button type="button" onClick={() => setEditing('new')} className={primaryButtonClass}>
            <Plus className="w-4 h-4" /> {t('admissions.addEnquiry')}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          [t('admissions.newThisMonth'), s?.newThisMonth, 'text-sky-700'],
          [t('admissions.inPipeline'), openCount, 'text-slate-900'],
          [t('admissions.followUpsDue'), s?.followUpsDue, s?.followUpsDue ? 'text-rose-600' : 'text-slate-900'],
          [t('admissions.admittedThisMonth'), s?.admittedThisMonth, 'text-emerald-700'],
        ].map(([label, value, tone]) => (
          <div key={label} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`text-2xl font-black mt-1 ${tone}`}>{stats.error ? '—' : (value ?? '…')}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border cursor-pointer ${
                tab === item.id ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {item.label}
              {item.count != null && (
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    tab === item.id ? 'bg-white/25' : item.warn && item.count ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(query.trim());
          }}
          className="relative w-full xl:w-72"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) setQ('');
            }}
            placeholder={t('admissions.searchPlaceholder')}
            className={`${fieldClass} pl-9 bg-white`}
          />
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AsyncState state={enquiries} loadingText={t('admissions.loading')}>
          {() =>
            shown.length === 0 ? (
              <EmptyMessage text={tab === FOLLOW_UPS ? t('admissions.noFollowUps') : t('admissions.none')} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {shown.map((e) => (
                  <EnquiryRow
                    key={e.id}
                    enquiry={e}
                    onStatus={() => setStatusFor(e)}
                    onAdmit={() => setAdmitting(e)}
                    onEdit={() => setEditing(e)}
                    onDelete={() => setDeleting(e)}
                  />
                ))}
              </ul>
            )
          }
        </AsyncState>
      </div>

      {editing && (
        <EnquiryModal
          enquiry={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reloadAll();
          }}
        />
      )}
      {statusFor && (
        <StatusModal
          enquiry={statusFor}
          onClose={() => setStatusFor(null)}
          onSaved={() => {
            setStatusFor(null);
            reloadAll();
          }}
        />
      )}
      {admitting && (
        <AdmitModal enquiry={admitting} classes={classes.data ?? []} onClose={() => setAdmitting(null)} onAdmitted={reloadAll} />
      )}
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title={t('admissions.deleteTitle')}
        message={deleting ? `${deleting.studentName} · ${deleting.parentName}` : ''}
        confirmLabel={t('common.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await http.delete(`/enquiries/${encodeURIComponent(deleting.id)}`);
          setDeleting(null);
          reloadAll();
        }}
      />
    </AdminPageShell>
  );
};

export default AdmissionsPage;
