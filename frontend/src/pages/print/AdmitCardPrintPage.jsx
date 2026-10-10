import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { AdmitCardsSheet } from '@/components/common/AdmitCardSheet';
import { PrintPageShell } from './PrintPageShell';

/**
 * /admit-cards/:examId?className=5-B (staff: a whole class, two cards per page) or ?studentId=STU-… (one student;
 * the student, their parent or staff). The backend checks access.
 */
export const AdmitCardPrintPage = () => {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const className = searchParams.get('className');
  const studentId = searchParams.get('studentId');
  const cards = useApi(
    withQuery(`/exams/${encodeURIComponent(examId)}/admit-cards`, { className: studentId ? undefined : className, studentId }),
  );

  const title = cards.data?.exam?.name
    ? `Admit cards — ${cards.data.exam.name}${className && !studentId ? ` (Class ${className})` : ''}`
    : 'Admit cards';

  return (
    <PrintPageShell title={title}>
      <AsyncState state={cards} loadingText="Loading admit cards…">
        {(data) => <AdmitCardsSheet data={data} />}
      </AsyncState>
    </PrintPageShell>
  );
};

export default AdmitCardPrintPage;
