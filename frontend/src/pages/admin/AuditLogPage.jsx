import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { addDays, formatDateTime, todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';

const LIMIT = 200;

const METHOD_STYLES = {
  POST: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PUT: 'bg-sky-50 text-sky-700 border-sky-200',
  PATCH: 'bg-sky-50 text-sky-700 border-sky-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
};

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#FF6B2C] focus:outline-none';

/** /admin/audit — who changed what and when, filtered by date range and text. */
export const AuditLogPage = () => {
  const { tx } = useI18n();
  const [filters, setFilters] = useState(() => ({ from: addDays(todayIso(), -6), to: todayIso(), q: '' }));
  const [draft, setDraft] = useState(filters);
  const log = useApi(withQuery('/admin/audit', { ...filters, limit: LIMIT }));

  const apply = (e) => {
    e.preventDefault();
    setFilters({ ...draft, q: draft.q.trim() });
  };

  return (
    <AdminPageShell
      activeItemId="audit"
      title="Audit Log"
      description="Every change made in the system, newest first."
    >
      <form
        onSubmit={apply}
        className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[160px_160px_1fr_auto] gap-3 items-end"
      >
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-500">From</span>
          <input
            type="date"
            value={draft.from}
            max={draft.to || undefined}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-500">To</span>
          <input
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-500">{tx('Search')}</span>
          <span className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              placeholder="Name, ID, action or path"
              className={`${inputClass} pl-9`}
            />
          </span>
        </label>
        <button
          type="submit"
          className="h-10 px-5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs rounded-xl cursor-pointer"
        >
          {tx('Apply')}
        </button>
      </form>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AsyncState state={log} loadingText="Loading audit log…">
          {(rows) =>
            !rows || rows.length === 0 ? (
              <EmptyMessage text="No activity found for these filters." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 sm:px-6">When</th>
                        <th className="py-3 px-4">Who</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Request</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {rows.map((row) => {
                        const failed = Number(row.status) >= 400;
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/60 align-top">
                            <td className="py-3 px-4 sm:px-6 text-slate-600 whitespace-nowrap">{formatDateTime(row.at)}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800">{row.actorName || row.actorId || '—'}</span>
                              <span className="block text-[11px] text-slate-400">
                                {[row.actorId, row.role].filter(Boolean).join(' · ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{row.action || '—'}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-1.5 py-0.5 mr-1.5 rounded-md border text-[10px] font-bold ${
                                  METHOD_STYLES[row.method] || 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {row.method}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500 break-all">{row.path}</span>
                            </td>
                            <td
                              className={`py-3 px-4 sm:px-6 text-right font-bold whitespace-nowrap ${
                                failed ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {row.status ?? '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {rows.length >= LIMIT && (
                  <p className="px-6 py-3 text-[11px] text-slate-500 border-t border-slate-100">
                    Showing the newest {LIMIT} entries. Narrow the dates or search to see older ones.
                  </p>
                )}
              </>
            )
          }
        </AsyncState>
      </div>
    </AdminPageShell>
  );
};

export default AuditLogPage;
