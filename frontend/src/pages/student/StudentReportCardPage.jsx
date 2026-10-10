import React from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ReportCardSheet } from '@/components/common/ReportCardSheet';
import { PrintButton } from '@/components/common/PrintButton';
import { useI18n } from '@/i18n/translate';

/** The signed-in student's CBSE-style report card for the current session (published results only). */
export const StudentReportCardPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const studentId = currentUser?.studentId || currentUser?.id;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Award className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>{tx('Academic Report Card')}</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Published results, attendance and your class teacher&apos;s remarks for this session.
          </p>
        </div>
        <PrintButton label="Print Report" />
      </div>

      <ReportCardSheet studentId={studentId} />
    </div>
  );
};

export default StudentReportCardPage;
