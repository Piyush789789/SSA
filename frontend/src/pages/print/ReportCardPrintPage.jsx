import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReportCardSheet } from '@/components/common/ReportCardSheet';
import { PrintPageShell } from './PrintPageShell';

/** /report-card/:studentId — printable report card for any signed-in user (the backend checks access). */
export const ReportCardPrintPage = () => {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  return (
    <PrintPageShell title="Report Card">
      <ReportCardSheet studentId={studentId} academicYear={searchParams.get('academicYear') || undefined} />
    </PrintPageShell>
  );
};

export default ReportCardPrintPage;
