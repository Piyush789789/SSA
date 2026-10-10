import React, { useState } from 'react';
import { HeartPulse, Home, Pencil, Plus, Stethoscope } from 'lucide-react';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
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
import { formatDate, formatDateTime, todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** Fields of a health record; `long` ones are text areas. */
const FIELDS = [
  { key: 'heightCm', label: 'health.height', type: 'number', min: 30, max: 220, unit: 'cm' },
  { key: 'weightKg', label: 'health.weight', type: 'number', min: 5, max: 200, unit: 'kg' },
  { key: 'bloodGroup', label: 'health.bloodGroup', type: 'blood' },
  { key: 'visionLeft', label: 'health.visionLeft', max: 20 },
  { key: 'visionRight', label: 'health.visionRight', max: 20 },
  { key: 'lastCheckupDate', label: 'health.lastCheckup', type: 'date' },
  { key: 'allergies', label: 'health.allergies', long: true, max: 1000 },
  { key: 'conditions', label: 'health.conditions', long: true, max: 1000 },
  { key: 'medications', label: 'health.medications', long: true, max: 1000 },
  { key: 'emergencyContactName', label: 'health.emergencyName', max: 100 },
  { key: 'emergencyContactPhone', label: 'health.emergencyPhone', max: 20, type: 'tel' },
  { key: 'familyDoctor', label: 'health.familyDoctor', max: 100 },
];
const BODY_KEYS = FIELDS.map((f) => f.key);

const display = (field, value) => {
  if (value == null || value === '') return '—';
  if (field.type === 'date') return formatDate(value);
  if (field.unit) return `${value} ${field.unit}`;
  return value;
};

const HealthEditModal = ({ studentId, record, editable, onClose, onSaved }) => {
  const { t } = useI18n();
  const [form, setForm] = useState(() =>
    Object.fromEntries(BODY_KEYS.map((k) => [k, record?.[k] == null ? '' : String(record[k])])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fields = FIELDS.filter((f) => !editable || editable.includes(f.key));

  const submit = async (e) => {
    e.preventDefault();
    const body = {};
    BODY_KEYS.forEach((key) => {
      const field = FIELDS.find((f) => f.key === key);
      const raw = String(form[key] ?? '').trim();
      body[key] = raw === '' ? null : field.type === 'number' ? Number(raw) : raw;
    });
    setSaving(true);
    setError('');
    try {
      await http.put(`/health-records/${encodeURIComponent(studentId)}`, body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={t('health.editTitle')} icon={HeartPulse} size="lg" busy={saving} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((field) => {
            const value = form[field.key];
            const onChange = (e) => setForm((f) => ({ ...f, [field.key]: e.target.value }));
            return (
              <FormField key={field.key} label={t(field.label)} className={field.long ? 'sm:col-span-2' : ''}>
                {field.long ? (
                  <textarea rows={2} maxLength={field.max} value={value} onChange={onChange} className={textAreaClass} />
                ) : field.type === 'blood' ? (
                  <select value={value} onChange={onChange} className={`${fieldClass} cursor-pointer`}>
                    <option value="">—</option>
                    {[...new Set([...BLOOD_GROUPS, value].filter(Boolean))].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'blood' ? 'text' : field.type || 'text'}
                    step={field.type === 'number' ? '0.1' : undefined}
                    min={field.type === 'number' ? field.min : undefined}
                    max={field.type === 'number' ? field.max : field.type === 'date' ? todayIso() : undefined}
                    maxLength={field.type === 'number' || field.type === 'date' ? undefined : field.max}
                    value={value}
                    onChange={onChange}
                    className={fieldClass}
                  />
                )}
              </FormField>
            );
          })}
        </div>
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

/**
 * The health record (GET /health-records/{id}). `canEdit` shows an Edit button; `editable` limits the editable
 * fields (parents: allergies and medicines). Saving sends the whole record, so other fields keep their values.
 */
export const HealthRecordCard = ({ studentId, canEdit = false, editable }) => {
  const { t } = useI18n();
  const record = useApi(`/health-records/${encodeURIComponent(studentId)}`);
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-500" /> {t('health.recordTitle')}
        </h3>
        {canEdit && record.data && (
          <button type="button" onClick={() => setEditing(true)} className={`${secondaryButtonClass} !px-4 !py-2 !text-xs`}>
            <Pencil className="w-3.5 h-3.5" /> {editable ? t('health.editAllergies') : t('common.edit')}
          </button>
        )}
      </div>
      <AsyncState state={record} loadingText={t('health.loading')}>
        {(r) => (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              {FIELDS.filter((f) => !f.long).map((field) => (
                <div key={field.key}>
                  <p className="text-xs text-slate-500 mb-1">{t(field.label)}</p>
                  <p className="text-sm font-semibold text-slate-900">{display(field, r?.[field.key])}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {FIELDS.filter((f) => f.long).map((field) => (
                <div
                  key={field.key}
                  className={`rounded-2xl border p-3 ${
                    r?.[field.key] ? 'border-amber-200 bg-amber-50/60' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t(field.label)}</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1 whitespace-pre-line">{r?.[field.key] || t('health.noneRecorded')}</p>
                </div>
              ))}
            </div>
            {r?.updatedAt && (
              <p className="text-[11px] text-slate-400">
                {t('health.updated', { at: formatDateTime(r.updatedAt), by: r.updatedBy || '—' })}
              </p>
            )}
          </>
        )}
      </AsyncState>
      {editing && (
        <HealthEditModal
          studentId={studentId}
          record={record.data}
          editable={editable}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            record.reload();
          }}
        />
      )}
    </div>
  );
};

const VisitModal = ({ studentId, studentName, onClose, onSaved }) => {
  const { t } = useI18n();
  const [form, setForm] = useState({ complaint: '', actionTaken: '', sentHome: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.complaint.trim()) return;
    setSaving(true);
    setError('');
    try {
      await http.post(`/health-records/${encodeURIComponent(studentId)}/visits`, {
        complaint: form.complaint.trim(),
        actionTaken: form.actionTaken.trim() || null,
        sentHome: form.sentHome,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={t('health.recordVisit')} subtitle={studentName} icon={Stethoscope} busy={saving} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormField label={t('health.complaint')} required>
          <textarea
            rows={2}
            required
            maxLength={1000}
            value={form.complaint}
            onChange={(e) => setForm((f) => ({ ...f, complaint: e.target.value }))}
            placeholder="e.g. Headache, fever 100°F"
            className={textAreaClass}
          />
        </FormField>
        <FormField label={t('health.actionTaken')}>
          <textarea
            rows={2}
            maxLength={1000}
            value={form.actionTaken}
            onChange={(e) => setForm((f) => ({ ...f, actionTaken: e.target.value }))}
            placeholder="e.g. Rested in sick room, given water"
            className={textAreaClass}
          />
        </FormField>
        <label className="flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.sentHome}
            onChange={(e) => setForm((f) => ({ ...f, sentHome: e.target.checked }))}
            className="mt-0.5 accent-[#FF6B2C]"
          />
          <span>
            <span className="block text-xs font-bold text-slate-800">{t('health.sentHome')}</span>
            <span className="block text-[11px] text-slate-500">{t('health.sentHomeHint')}</span>
          </span>
        </label>
        <FormError message={error} />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={saving || !form.complaint.trim()} className={primaryButtonClass}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/** Sick-room visits (GET /health-records/{id}/visits); staff can record a new one (notifies the family). */
export const HealthVisits = ({ studentId, studentName, canRecord = false }) => {
  const { t } = useI18n();
  const visits = useApi(`/health-records/${encodeURIComponent(studentId)}/visits`);
  const [recording, setRecording] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-[#FF6B2C]" /> {t('health.visits')}
        </h3>
        {canRecord && (
          <button type="button" onClick={() => setRecording(true)} className={`${primaryButtonClass} !px-4 !py-2 !text-xs`}>
            <Plus className="w-3.5 h-3.5" /> {t('health.recordVisit')}
          </button>
        )}
      </div>
      <AsyncState state={visits} loadingText={t('health.loadingVisits')}>
        {(list) =>
          !list?.length ? (
            <EmptyMessage text={t('health.noVisits')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {[...list]
                .sort((a, b) => String(b.at).localeCompare(String(a.at)))
                .map((v) => (
                  <li key={v.id} className="p-4 sm:p-5 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{v.complaint}</p>
                      {v.sentHome && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-[11px] font-bold text-rose-700">
                          <Home className="w-3 h-3" /> {t('health.sentHomeChip')}
                        </span>
                      )}
                    </div>
                    {v.actionTaken && <p className="text-xs text-slate-600">{v.actionTaken}</p>}
                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(v.at)}
                      {v.recordedBy ? ` · ${v.recordedBy}` : ''}
                    </p>
                  </li>
                ))}
            </ul>
          )
        }
      </AsyncState>
      {recording && (
        <VisitModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setRecording(false)}
          onSaved={() => {
            setRecording(false);
            visits.reload();
          }}
        />
      )}
    </div>
  );
};

/**
 * Health tab / page. `mode`: 'staff' (admin, class teacher: edit everything + record visits),
 * 'parent' (edit allergies and medicines) or 'student' (read only).
 */
export const HealthPanel = ({ studentId, studentName, mode = 'student', canEditRecord = true }) => (
  <div className="space-y-6">
    <HealthRecordCard
      studentId={studentId}
      canEdit={mode === 'parent' || (mode === 'staff' && canEditRecord)}
      editable={mode === 'parent' ? ['allergies', 'medications'] : undefined}
    />
    <HealthVisits studentId={studentId} studentName={studentName} canRecord={mode === 'staff'} />
  </div>
);

export default HealthPanel;
