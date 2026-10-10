import React, { useState } from 'react';
import { Info, Search } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { CertificatesList } from '@/components/common/CertificatesList';
import { useApi } from '@/hooks/useApi';

const TYPES = [
  ['ALL', 'All'],
  ['TC', 'Transfer Certificates'],
  ['BONAFIDE', 'Bonafide'],
];

/** /admin/certificates — the latest certificates issued (TC / Bonafide) with print links. */
export const CertificatesPage = () => {
  const certificates = useApi('/certificates');
  const [type, setType] = useState('ALL');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filter = (c) =>
    (type === 'ALL' || c.type === type) &&
    (!q ||
      c.id?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) ||
      c.studentId?.toLowerCase().includes(q) ||
      c.className?.toLowerCase().includes(q));

  return (
    <AdminPageShell
      activeItemId="certificates"
      title="Certificates"
      description="Transfer and bonafide certificates issued by the school (latest 200)."
    >
      <p className="flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs font-medium text-sky-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        To issue a new certificate, open the student&apos;s profile (Students → student) and use “Issue TC” or “Issue
        Bonafide”.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold border cursor-pointer ${
                type === key ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search serial no., student or class"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
          />
        </label>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <CertificatesList
          state={certificates}
          showStudent
          studentLink={(c) => `/admin/students/${encodeURIComponent(c.studentId)}`}
          filter={filter}
          emptyText={q || type !== 'ALL' ? 'No certificates match these filters.' : 'No certificates issued yet.'}
        />
      </div>
    </AdminPageShell>
  );
};

export default CertificatesPage;
