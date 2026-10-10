import React, { useState } from 'react';
import { AlertCircle, Edit3, Loader2 } from 'lucide-react';
import { http } from '@/api/http';
import { useI18n } from '@/i18n/translate';

/**
 * Small inline "Edit" forms for contact details people may change themselves. Everything else
 * (name, class, roll number, linked children) stays with the school office.
 */

/** A student's address and guardian phone/email. Usable by the student and their parent. */
export const StudentContactEditor = ({ student, onSaved }) => (
  <InlineEditForm
    buttonLabel="Edit contact details"
    fields={[
      { key: 'address', label: 'Residential address', type: 'text' },
      { key: 'guardianPhone', label: 'Guardian phone', type: 'tel' },
      { key: 'guardianEmail', label: 'Guardian email', type: 'email' },
    ]}
    initialValues={{
      address: student?.address ?? '',
      guardianPhone: student?.guardian?.phone ?? student?.parent?.phone ?? '',
      guardianEmail: student?.guardian?.email ?? student?.parent?.email ?? '',
    }}
    save={(values) => http.put(`/students/${student.id}/contact`, values)}
    onSaved={onSaved}
  />
);

/** The signed-in parent's own phone and email. */
export const ParentContactEditor = ({ parent, onSaved }) => (
  <InlineEditForm
    buttonLabel="Edit my contact details"
    fields={[
      { key: 'phone', label: 'Phone', type: 'tel' },
      { key: 'email', label: 'Email', type: 'email' },
    ]}
    initialValues={{ phone: parent?.phone ?? '', email: parent?.email ?? '' }}
    save={(values) => http.put('/me/parent-profile', values)}
    onSaved={onSaved}
  />
);

const InlineEditForm = ({ buttonLabel, fields, initialValues, save, onSaved }) => {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setValues(initialValues);
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#FF6B2C] hover:text-[#FF6B2C]"
      >
        <Edit3 className="h-3.5 w-3.5" />
        {buttonLabel}
      </button>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim() || null]));
      await save(trimmed);
      await onSaved?.();
      setOpen(false);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {fields.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">{field.label}</span>
          <input
            type={field.type}
            value={values[field.key]}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#FF6B2C] focus:outline-none"
          />
        </label>
      ))}
      {error ? (
        <p className="flex items-start gap-1.5 text-xs font-semibold text-red-700">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" />
          {error.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
        >
          {tx('Cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B2C] px-4 py-2 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {saving ? tx('Saving…') : tx('Save')}
        </button>
      </div>
    </form>
  );
};
