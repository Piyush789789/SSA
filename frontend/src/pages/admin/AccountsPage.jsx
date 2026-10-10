import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, KeyRound, Loader2, Plus, Search, ShieldCheck, UserCog, X } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { formatDateTime } from '@/utils';
import { useI18n } from '@/i18n/translate';

const TABS = [
  { role: 'STUDENT', label: 'Students' },
  { role: 'PARENT', label: 'Parents' },
  { role: 'TEACHER', label: 'Teachers' },
  { role: 'ADMIN', label: 'Staff logins' },
];

/** "Fees & payments, Attendance" or "Full administrator" for an ADMIN account row. */
const describeRole = (account, permissionLabels) =>
  account.permissions?.length
    ? account.permissions.map((p) => permissionLabels[p] ?? p).join(', ')
    : 'Full administrator';

/**
 * Who can sign in: create a login (temporary password), reset a password, enable/disable an account,
 * and manage parent records with their linked children.
 */
export const AccountsPage = () => {
  const { tx } = useI18n();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState('STUDENT');
  const [query, setQuery] = useState('');
  const accounts = useApi('/accounts');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [issued, setIssued] = useState(null); // { account, temporaryPassword, reason }
  const [parentForm, setParentForm] = useState(null); // null = closed, {} = new, parent = edit
  const [staffForm, setStaffForm] = useState(null); // null = closed, {} = new staff login, account = edit role
  const [toast, setToast] = useState('');
  const permissionOptions = useApi(tab === 'ADMIN' || staffForm ? '/accounts/permissions' : null);
  const permissionLabels = useMemo(
    () => Object.fromEntries((permissionOptions.data ?? []).map((p) => [p.id, p.label])),
    [permissionOptions.data],
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const run = async (key, action) => {
    setBusyId(key);
    setError('');
    try {
      await action();
      accounts.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const createLogin = (person) =>
    run(person.profileId, async () => {
      const result = await http.post('/accounts', { role: person.role, profileId: person.profileId });
      setIssued({ ...result, reason: 'created' });
    });

  const resetPassword = (person) =>
    run(person.accountId, async () => {
      const result = await http.post(`/accounts/${person.accountId}/reset-password`);
      setIssued({ ...result, reason: 'reset' });
    });

  const toggleActive = (person) =>
    run(person.accountId, async () => {
      await http.put(`/accounts/${person.accountId}/active`, { active: !person.active });
      showToast(person.active ? `${person.name} can no longer sign in.` : `${person.name} can sign in again.`);
    });

  const counts = useMemo(() => {
    const c = {};
    (accounts.data || []).forEach((a) => {
      c[a.role] = (c[a.role] || 0) + 1;
    });
    return c;
  }, [accounts.data]);

  const q = query.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">{toast}</span>
        </div>
      )}

      <Sidebar activeItemId="accounts" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{tx('Logins & Parents')}</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Create sign-in accounts, reset forgotten passwords, and link parents to their children.
              </p>
            </div>
            {tab === 'PARENT' ? (
              <button
                type="button"
                onClick={() => setParentForm({})}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 self-start"
              >
                <Plus className="w-4 h-4" /> {tx('Add parent')}
              </button>
            ) : tab === 'ADMIN' ? (
              <button
                type="button"
                onClick={() => setStaffForm({})}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 self-start"
              >
                <Plus className="w-4 h-4" /> {tx('Add staff login')}
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.role}
                  type="button"
                  onClick={() => setTab(t.role)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold border ${
                    tab === t.role ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {tx(t.label)} {counts[t.role] ? `(${counts[t.role]})` : ''}
                </button>
              ))}
            </div>
            <label className="relative block sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, ID or login"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
              />
            </label>
          </div>

          {error ? (
            <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          ) : null}

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <AsyncState state={accounts} loadingText="Loading accounts…">
              {(list) => {
                const rows = list.filter(
                  (a) =>
                    a.role === tab &&
                    (!q ||
                      a.name?.toLowerCase().includes(q) ||
                      a.profileId?.toLowerCase().includes(q) ||
                      a.loginId?.toLowerCase().includes(q)),
                );
                if (rows.length === 0) return <EmptyMessage text="Nobody found." />;
                return (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[820px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-5">Name</th>
                          <th className="py-3 px-5">Details</th>
                          <th className="py-3 px-5">Login</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5">Last sign-in</th>
                          <th className="py-3 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((a) => {
                          const key = a.accountId || a.profileId;
                          const busy = busyId === a.accountId || busyId === a.profileId;
                          return (
                            <tr key={key} className="hover:bg-slate-50/70">
                              <td className="py-3.5 px-5">
                                <div className="font-bold text-slate-900">{a.name}</div>
                                {a.profileId ? <div className="font-mono text-[11px] text-slate-400">{a.profileId}</div> : null}
                              </td>
                              {a.role === 'ADMIN' ? (
                                <td className="py-3.5 px-5 text-slate-600 max-w-[260px]">
                                  {a.staffTitle ? <div className="font-bold text-slate-800">{a.staffTitle}</div> : null}
                                  <div
                                    className={`truncate ${a.permissions?.length ? '' : 'font-semibold text-[#FF6B2C]'}`}
                                    title={describeRole(a, permissionLabels)}
                                  >
                                    {describeRole(a, permissionLabels)}
                                  </div>
                                </td>
                              ) : (
                                <td className="py-3.5 px-5 text-slate-600 max-w-[220px] truncate" title={a.detail}>
                                  {a.detail || '—'}
                                </td>
                              )}
                              <td className="py-3.5 px-5 font-mono text-slate-700">{a.loginId || '—'}</td>
                              <td className="py-3.5 px-5">
                                <StatusBadge account={a} />
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                                {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : 'Never'}
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="flex justify-end gap-2">
                                  {busy ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
                                  {a.role === 'PARENT' ? (
                                    <SmallButton onClick={() => setParentForm(a)}>Edit / children</SmallButton>
                                  ) : null}
                                  {!a.accountId && a.role !== 'ADMIN' ? (
                                    <SmallButton primary disabled={busy} onClick={() => createLogin(a)}>
                                      Create login
                                    </SmallButton>
                                  ) : null}
                                  {a.role === 'ADMIN' && a.accountId ? (
                                    <SmallButton onClick={() => setStaffForm(a)}>Edit role</SmallButton>
                                  ) : null}
                                  {a.accountId ? (
                                    <>
                                      <SmallButton disabled={busy} onClick={() => resetPassword(a)}>
                                        Reset password
                                      </SmallButton>
                                      <SmallButton danger={a.active} disabled={busy} onClick={() => toggleActive(a)}>
                                        {a.active ? 'Disable' : 'Enable'}
                                      </SmallButton>
                                    </>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }}
            </AsyncState>
          </div>
        </main>
      </div>

      {issued ? <TemporaryPasswordDialog issued={issued} onClose={() => setIssued(null)} /> : null}
      {staffForm ? (
        <StaffDialog
          account={staffForm.accountId ? staffForm : null}
          options={permissionOptions}
          onClose={() => setStaffForm(null)}
          onCreated={(result) => {
            setStaffForm(null);
            accounts.reload();
            setIssued({ ...result, reason: 'created' });
          }}
          onSaved={(message) => {
            setStaffForm(null);
            accounts.reload();
            showToast(message);
          }}
        />
      ) : null}
      {parentForm ? (
        <ParentDialog
          parent={parentForm.profileId ? parentForm : null}
          onClose={() => setParentForm(null)}
          onSaved={(message) => {
            setParentForm(null);
            accounts.reload();
            showToast(message);
          }}
        />
      ) : null}
    </div>
  );
};

const StatusBadge = ({ account }) => {
  if (!account.accountId) {
    return <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-500">No login</span>;
  }
  if (!account.active) {
    return <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-semibold text-red-700">Disabled</span>;
  }
  if (account.mustChangePassword) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
        Temporary password
      </span>
    );
  }
  return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Active</span>;
};

const SmallButton = ({ children, onClick, primary, danger, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap disabled:opacity-50 ${
      primary
        ? 'border-[#FF6B2C] bg-[#FF6B2C] text-white hover:bg-[#F25A1B]'
        : danger
          ? 'border-slate-200 text-red-600 hover:bg-red-50'
          : 'border-slate-200 text-slate-700 hover:border-[#FF6B2C] hover:text-[#FF6B2C]'
    }`}
  >
    {children}
  </button>
);

/** Shows a new temporary password once. It is not stored anywhere readable. */
const TemporaryPasswordDialog = ({ issued, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { account, temporaryPassword, reason } = issued;
  const text = `Login: ${account.loginId}\nTemporary password: ${temporaryPassword}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <KeyRound className="h-5 w-5 text-[#FF6B2C]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">{reason === 'reset' ? 'Password reset' : 'Login created'}</h3>
            <p className="text-xs text-slate-500">{account.name}</p>
          </div>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm">
          <div>
            <span className="text-slate-500">Login: </span>
            <strong>{account.loginId}</strong>
          </div>
          <div>
            <span className="text-slate-500">Temporary password: </span>
            <strong className="tracking-wider">{temporaryPassword}</strong>
          </div>
        </div>
        <p className="text-xs text-slate-600">
          Give this to {account.name} privately. It is shown only now. They must choose their own password the first time
          they sign in{reason === 'reset' ? ', and they have been signed out of other devices' : ''}.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => {});
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#FF6B2C]"
          >
            <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={onClose} className="rounded-xl bg-[#FF6B2C] px-5 py-2 text-xs font-bold text-white hover:bg-[#F25A1B]">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/** Add or edit a parent and choose their children. `parent` is an account row (role PARENT) or null for new. */
const ParentDialog = ({ parent, onClose, onSaved }) => {
  const record = useApi(parent ? '/parents' : null);
  const students = useApi('/students');
  const existing = parent ? (record.data || []).find((p) => p.id === parent.profileId) : null;
  const ready = !parent || existing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <UserCog className="h-5 w-5 text-[#FF6B2C]" /> {parent ? 'Edit parent' : 'Add parent'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <AsyncState state={parent ? [record, students] : students}>
            {() =>
              ready ? (
                <ParentForm parent={existing} students={students.data} onSaved={onSaved} onCancel={onClose} />
              ) : (
                <EmptyMessage text="Parent not found." />
              )
            }
          </AsyncState>
        </div>
      </div>
    </div>
  );
};

const ParentForm = ({ parent, students, onSaved, onCancel }) => {
  const { tx } = useI18n();
  const [values, setValues] = useState({
    name: parent?.name ?? '',
    relation: parent?.relation ?? 'Father',
    phone: parent?.phone ?? '',
    email: parent?.email ?? '',
  });
  const [childIds, setChildIds] = useState(parent?.childIds ?? []);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const s = search.trim().toLowerCase();
  const matches = s
    ? students.filter((st) => !childIds.includes(st.id) && (st.name.toLowerCase().includes(s) || st.id.toLowerCase().includes(s))).slice(0, 6)
    : [];
  const byId = Object.fromEntries(students.map((st) => [st.id, st]));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = { ...values, email: values.email.trim() || null, phone: values.phone.trim() || null, childIds };
    try {
      if (parent) {
        await http.put(`/parents/${parent.id}`, body);
        onSaved('Parent updated.');
      } else {
        await http.post('/parents', body);
        onSaved('Parent added. Use "Create login" to give them access.');
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const input = (key, label, type = 'text') => (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={values[key]}
        required={key === 'name'}
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {input('name', 'Full name')}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">Relation</span>
          <select
            value={values.relation}
            onChange={(e) => setValues((v) => ({ ...v, relation: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
          >
            {['Father', 'Mother', 'Guardian'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        {input('phone', 'Phone', 'tel')}
      </div>
      {input('email', 'Email (used as the login)', 'email')}

      <div>
        <span className="mb-1 block text-xs font-bold text-slate-700">Children</span>
        <div className="mb-2 flex flex-wrap gap-2">
          {childIds.length === 0 ? <span className="text-xs text-slate-400">No children linked yet.</span> : null}
          {childIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {byId[id]?.name ?? id} {byId[id] ? `(${byId[id].className})` : ''}
              <button type="button" aria-label="Remove" onClick={() => setChildIds((c) => c.filter((x) => x !== id))}>
                <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a student to link…"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
        />
        {matches.length > 0 ? (
          <div className="mt-1 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {matches.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setChildIds((c) => [...c, st.id]);
                  setSearch('');
                }}
                className="flex w-full justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-800">{st.name}</span>
                <span className="text-slate-400">
                  {st.className} · {st.id}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" /> {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
          {tx('Cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60"
        >
          {saving ? tx('Saving…') : tx('Save')}
        </button>
      </div>
    </form>
  );
};

/**
 * Create a staff login (office staff, accountant…) or change an existing admin account's title and modules.
 * No module ticked = full administrator.
 */
const StaffDialog = ({ account, options, onClose, onCreated, onSaved }) => {
  const { tx } = useI18n();
  const [values, setValues] = useState({ name: '', loginId: '', staffTitle: account?.staffTitle ?? '' });
  const [permissions, setPermissions] = useState(account?.permissions ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id) => setPermissions((list) => (list.includes(id) ? list.filter((p) => p !== id) : [...list, id]));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const staffTitle = values.staffTitle.trim() || null;
    try {
      if (account) {
        await http.put(`/accounts/${account.accountId}/staff-role`, { staffTitle, permissions });
        onSaved(`${account.name}'s role updated.`);
      } else {
        const result = await http.post('/accounts/staff', {
          name: values.name.trim(),
          loginId: values.loginId.trim(),
          staffTitle,
          permissions,
        });
        onCreated(result);
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const inputClass =
    'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <ShieldCheck className="h-5 w-5 text-[#FF6B2C]" /> {account ? `Role — ${account.name}` : 'Add staff login'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          {!account ? (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Full name</span>
                <input
                  required
                  maxLength={100}
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">Login (email or a user name)</span>
                <input
                  required
                  maxLength={100}
                  value={values.loginId}
                  onChange={(e) => setValues((v) => ({ ...v, loginId: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">Title (optional)</span>
            <input
              maxLength={60}
              value={values.staffTitle}
              placeholder="e.g. Accountant, Office Assistant"
              onChange={(e) => setValues((v) => ({ ...v, staffTitle: e.target.value }))}
              className={inputClass}
            />
          </label>

          <div>
            <span className="mb-1 block text-xs font-bold text-slate-700">Can change</span>
            <AsyncState state={options} loadingText="Loading modules…">
              {(list) => (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(list ?? []).map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer ${
                        permissions.includes(p.id) ? 'border-[#FF6B2C] bg-[#FFF5F0] text-slate-900' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <input type="checkbox" checked={permissions.includes(p.id)} onChange={() => toggle(p.id)} className="accent-[#FF6B2C]" />
                      {p.label}
                    </label>
                  ))}
                </div>
              )}
            </AsyncState>
            <p
              className={`mt-2 rounded-xl border p-3 text-xs font-semibold ${
                permissions.length ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              {permissions.length
                ? 'They can view every admin page but change only the ticked modules. Settings, Logins, Promotion, Backups and Audit stay closed to them.'
                : 'No module ticked: this login will be a full administrator with access to everything.'}
            </p>
          </div>

          {error ? (
            <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="mt-px h-4 w-4 shrink-0" /> {error}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
            {tx('Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60"
          >
            {saving ? tx('Saving…') : tx(account ? 'Save role' : 'Create login')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountsPage;
