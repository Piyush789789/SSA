import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, FileBadge, Loader2, Printer, X } from 'lucide-react';
import { CertificatesList } from '@/components/common/CertificatesList';
import { CERTIFICATE_TITLES, CONDUCT_OPTIONS } from '@/components/common/certificates';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#FF6B2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/15';

const IssueCertificateModal = ({ type, student, onClose, onIssued }) => {
  const { tx } = useI18n();
  const isTc = type === 'TC';
  const [form, setForm] = useState({
    reason: '',
    conduct: 'Good',
    leavingDate: isTc ? todayIso() : '',
    remarks: '',
  });
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (isTc && !form.leavingDate) return setError('Enter the date the student left.');
    if (isTc && !confirmed) return setError('Tick the box to confirm the student is leaving.');
    setSaving(true);
    setError('');
    try {
      const body = { type, conduct: form.conduct || undefined };
      if (form.reason.trim()) body.reason = form.reason.trim();
      if (form.remarks.trim()) body.remarks = form.remarks.trim();
      if (isTc && form.leavingDate) body.leavingDate = form.leavingDate;
      const certificate = await http.post(`/students/${encodeURIComponent(student.id)}/certificates`, body);
      onIssued(certificate);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Issue {CERTIFICATE_TITLES[type]}</h3>
            <p className="text-xs text-slate-500">
              {student.name} · Class {student.className} · {student.id}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isTc && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Issuing a Transfer Certificate marks <span className="font-bold">{student.name}</span> as{' '}
              <span className="font-bold">Left</span> and disables their login (and stops them appearing in class
              lists). This cannot be undone from here.
            </p>
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-600">{isTc ? 'Reason for leaving' : 'Purpose'}</span>
          <input
            value={form.reason}
            onChange={set('reason')}
            placeholder={isTc ? 'e.g. Family relocating' : 'e.g. Bank account opening'}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-600">Conduct</span>
            <select value={form.conduct} onChange={set('conduct')} className={inputClass}>
              {CONDUCT_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          {isTc && (
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-600">
                Leaving date <span className="text-rose-500">*</span>
              </span>
              <input type="date" value={form.leavingDate} onChange={set('leavingDate')} className={inputClass} />
            </label>
          )}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Remarks</span>
          <textarea rows={2} value={form.remarks} onChange={set('remarks')} className={inputClass} />
        </label>

        {isTc && (
          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-rose-600"
            />
            I understand that {student.name} will be marked as Left and can no longer sign in.
          </label>
        )}

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
          >
            {tx('Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || (isTc && !confirmed)}
            className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              isTc ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#FF6B2C] hover:bg-[#F25A1B]'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBadge className="w-4 h-4" />}
            {saving ? 'Issuing…' : `Issue ${isTc ? 'TC' : 'certificate'}`}
          </button>
        </div>
      </form>
    </div>
  );
};

/** Admin student profile tab: issue TC / Bonafide and list this student's certificates. */
export const ProfileCertificates = ({ student, onStudentChanged }) => {
  const certificates = useApi(`/students/${encodeURIComponent(student.id)}/certificates`);
  const [issuing, setIssuing] = useState(null); // 'TC' | 'BONAFIDE'
  const [issued, setIssued] = useState(null);
  const hasLeft = student.status && student.status !== 'Active';

  const handleIssued = (certificate) => {
    setIssuing(null);
    setIssued(certificate);
    certificates.reload();
    if (certificate?.type === 'TC' && onStudentChanged) onStudentChanged();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Certificates</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue a Transfer Certificate when the student leaves, or a Bonafide Certificate on request.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIssuing('BONAFIDE')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg cursor-pointer"
          >
            <FileBadge className="w-4 h-4" /> Issue Bonafide
          </button>
          <button
            type="button"
            onClick={() => setIssuing('TC')}
            disabled={hasLeft}
            title={hasLeft ? `This student is already marked ${student.status}.` : undefined}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileBadge className="w-4 h-4" /> Issue TC
          </button>
        </div>
      </div>

      {issued && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {CERTIFICATE_TITLES[issued.type]} {issued.id} issued.
          </span>
          <Link
            to={`/certificate/${encodeURIComponent(issued.id)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100 self-start"
          >
            <Printer className="w-3.5 h-3.5" /> Print now
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <CertificatesList state={certificates} emptyText={`No certificates issued for ${student.name} yet.`} />
      </div>

      {issuing && (
        <IssueCertificateModal
          type={issuing}
          student={student}
          onClose={() => setIssuing(null)}
          onIssued={handleIssued}
        />
      )}
    </div>
  );
};

export default ProfileCertificates;
