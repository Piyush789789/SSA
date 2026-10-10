import React from 'react';
import { useParams } from 'react-router-dom';
import { CertificateSheet } from '@/components/common/CertificateSheet';
import { PrintPageShell } from './PrintPageShell';

/** /certificate/:certificateId — printable TC / Bonafide certificate (the backend checks access). */
export const CertificatePrintPage = () => {
  const { certificateId } = useParams();
  return (
    <PrintPageShell title="Certificate">
      <CertificateSheet certificateId={certificateId} />
    </PrintPageShell>
  );
};

export default CertificatePrintPage;
