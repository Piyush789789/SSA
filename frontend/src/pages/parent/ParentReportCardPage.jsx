import React from 'react';
import { Award, FileBadge } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { EmptyMessage } from '@/components/common/AsyncState';
import { ReportCardSheet } from '@/components/common/ReportCardSheet';
import { CertificatesList } from '@/components/common/CertificatesList';
import { PrintButton } from '@/components/common/PrintButton';
import { useI18n } from '@/i18n/translate';

/** /parent/report-card — the selected child's report card (printable) and the certificates issued to them. */
export const ParentReportCardPage = () => {
  const { tx } = useI18n();
  const { currentUser, selectedChild, switchChild } = useAuth();
  const linkedChildren = currentUser?.linkedChildren || [];
  const childId = selectedChild?.studentId ?? null;
  const certificates = useApi(childId ? `/students/${encodeURIComponent(childId)}/certificates` : null);

  if (!selectedChild) {
    return <EmptyMessage text="No child is linked to this parent account yet." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-[#FF6B2C]" />
            {tx('Report Card')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Published results, attendance and teacher remarks for {selectedChild.name} (Class {selectedChild.className}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {linkedChildren.length > 1 && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
              <select
                value={selectedChild.studentId}
                onChange={(e) => switchChild(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer pr-3"
              >
                {linkedChildren.map((child) => (
                  <option key={child.studentId} value={child.studentId}>
                    {child.name} ({child.className})
                  </option>
                ))}
              </select>
            </div>
          )}
          <PrintButton label="Print Report" />
        </div>
      </div>

      <ReportCardSheet studentId={childId} />

      <div className="no-print bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2.5">
          <FileBadge className="w-5 h-5 text-[#FF6B2C]" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Certificates</h2>
            <p className="text-xs text-slate-500 mt-0.5">Transfer and bonafide certificates issued by the school.</p>
          </div>
        </div>
        <CertificatesList
          state={certificates}
          emptyText={`No certificates have been issued for ${selectedChild.name}.`}
        />
      </div>
    </div>
  );
};

export default ParentReportCardPage;
