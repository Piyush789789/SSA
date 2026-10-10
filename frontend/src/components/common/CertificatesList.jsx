import React from 'react';
import { Link } from 'react-router-dom';
import { FileBadge, Printer } from 'lucide-react';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate } from '@/utils';
import { CERTIFICATE_TITLES } from './certificates';

const TYPE_BADGES = {
  TC: 'bg-rose-50 border-rose-200 text-rose-700',
  BONAFIDE: 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

/**
 * Table of certificates (from a useApi state) with a link to the printable page of each.
 * `showStudent` adds the student column (admin list of all certificates); `studentLink(c)` makes the name a link.
 */
export const CertificatesList = ({ state, showStudent = false, studentLink, emptyText = 'No certificates issued yet.', filter }) => (
  <AsyncState state={state} loadingText="Loading certificates…">
    {(all) => {
      const list = filter ? (all || []).filter(filter) : all || [];
      return list.length === 0 ? (
        <EmptyMessage text={emptyText} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Serial No.</th>
                <th className="py-3 px-4">Certificate</th>
                {showStudent && <th className="py-3 px-4">Student</th>}
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Issued On</th>
                <th className="py-3 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-[#FF6B2C] whitespace-nowrap">{c.id}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        TYPE_BADGES[c.type] || 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <FileBadge className="w-3.5 h-3.5" />
                      {CERTIFICATE_TITLES[c.type] || c.type}
                    </span>
                  </td>
                  {showStudent && (
                    <td className="py-3.5 px-4">
                      {studentLink ? (
                        <Link to={studentLink(c)} className="font-semibold text-slate-800 hover:text-[#FF6B2C]">
                          {c.studentName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-800">{c.studentName}</span>
                      )}
                      <span className="block text-[11px] text-slate-400">{c.studentId}</span>
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{c.className || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {formatDate(c.issuedOn)}
                    {c.issuedBy && <span className="block text-[11px] text-slate-400">by {c.issuedBy}</span>}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <Link
                      to={`/certificate/${encodeURIComponent(c.id)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF5F0] hover:bg-orange-100 text-[#FF6B2C] text-xs font-bold border border-orange-200/60"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      View / Print
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }}
  </AsyncState>
);

export default CertificatesList;
