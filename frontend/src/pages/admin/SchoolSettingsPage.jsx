import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { useI18n } from '@/i18n/translate';

const FIELDS = [
  { key: 'schoolName', label: 'School name', required: true, wide: true },
  { key: 'address', label: 'Address', wide: true, textarea: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'board', label: 'Board', placeholder: 'e.g. CBSE' },
  { key: 'affiliationNo', label: 'Affiliation no.' },
  { key: 'udiseCode', label: 'UDISE code' },
  { key: 'principalName', label: "Principal's name" },
];

const YEAR_PATTERN = /^\d{4}-\d{2}$/;

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#FF6B2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/15';

const SettingsForm = ({ initial, onSaved }) => {
  const { tx } = useI18n();
  const [form, setForm] = useState(() => {
    const values = {};
    [...FIELDS.map((f) => f.key), 'currentAcademicYear'].forEach((key) => {
      values[key] = initial?.[key] ?? '';
    });
    return values;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const year = form.currentAcademicYear.trim();
    if (!form.schoolName.trim()) return setError('Enter the school name.');
    if (!YEAR_PATTERN.test(year)) return setError('Academic year must look like 2026-27.');
    const start = Number(year.slice(0, 4));
    if ((start + 1) % 100 !== Number(year.slice(5))) {
      return setError(`Academic year ${year} should be ${start}-${String((start + 1) % 100).padStart(2, '0')}.`);
    }
    setSaving(true);
    setError('');
    try {
      const body = {};
      Object.entries(form).forEach(([key, value]) => {
        body[key] = typeof value === 'string' ? value.trim() : value;
      });
      await http.put('/settings', body);
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">School details</h2>
          <p className="text-xs text-slate-500 mt-0.5">Printed on report cards, certificates and receipts.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map((field) => (
            <label key={field.key} className={`block space-y-1.5 ${field.wide ? 'md:col-span-2' : ''}`}>
              <span className="text-xs font-bold text-slate-600">
                {field.label}
                {field.required && <span className="text-rose-500"> *</span>}
              </span>
              {field.textarea ? (
                <textarea rows={2} value={form[field.key]} onChange={set(field.key)} className={inputClass} />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={form[field.key]}
                  onChange={set(field.key)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Current academic year</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            New exams, fee heads and report cards use this session. Year-end promotion moves it forward automatically.
          </p>
        </div>
        <label className="block space-y-1.5 max-w-xs">
          <span className="text-xs font-bold text-slate-600">
            Academic year <span className="text-rose-500">*</span>
          </span>
          <input
            value={form.currentAcademicYear}
            onChange={set('currentAcademicYear')}
            placeholder="2026-27"
            className={inputClass}
          />
        </label>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {saved && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Settings saved.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? tx('Saving…') : tx('Save settings')}
        </button>
      </div>
    </form>
  );
};

/** /admin/settings — school details used on printed documents, and the current academic year. */
export const SchoolSettingsPage = () => {
  const settings = useApi('/settings');

  return (
    <AdminPageShell
      activeItemId="settings"
      title="School Settings"
      description="School details for letterheads and the current academic session."
    >
      <AsyncState state={settings} loadingText="Loading settings…">
        {(data) => <SettingsForm initial={data} onSaved={settings.reload} />}
      </AsyncState>
    </AdminPageShell>
  );
};

export default SchoolSettingsPage;
