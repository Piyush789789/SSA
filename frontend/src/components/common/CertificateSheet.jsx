import React from 'react';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { SchoolLetterhead } from '@/components/common/SchoolLetterhead';
import { formatDate } from '@/utils';
import { CERTIFICATE_TITLES } from './certificates';


const fmt = (date) => (date ? formatDate(date) : '—');

const Row = ({ index, label, value }) => (
  <tr>
    <td className="py-1.5 pr-2 align-top text-slate-500 w-8">{index}.</td>
    <td className="py-1.5 pr-4 align-top font-semibold text-slate-700 w-[45%]">{label}</td>
    <td className="py-1.5 align-top font-bold text-slate-900 border-b border-dotted border-slate-400">{value || '—'}</td>
  </tr>
);

/** The printable certificate, from the GET /certificates/{id} payload `{certificate, school}`. */
export const CertificateContent = ({ certificate: c, school }) => {
  const isTc = c.type === 'TC';
  const title = CERTIFICATE_TITLES[c.type] || 'Certificate';
  const ward = c.guardianName ? `, ward of ${c.guardianName},` : '';

  const tcRows = [
    ['Name of the student', c.studentName],
    ['Admission no.', c.studentId],
    ["Parent / guardian's name", c.guardianName],
    ['Date of birth (as per admission register)', fmt(c.dateOfBirth)],
    ['Date of admission', fmt(c.admissionDate)],
    ['Class in which last studied', c.className],
    ['Academic session', c.academicYear],
    ['Date of leaving the school', fmt(c.leavingDate)],
    ['Reason for leaving', c.reason],
    ['General conduct', c.conduct],
    ['Remarks', c.remarks],
    ['Date of issue', fmt(c.issuedOn)],
  ];

  return (
    <div className="print-sheet bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-6 text-slate-900">
      <SchoolLetterhead school={school} title={title} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Serial no.: {c.id}</span>
        <span>Date of issue: {fmt(c.issuedOn)}</span>
      </div>

      {isTc ? (
        <>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {tcRows.map(([label, value], i) => (
                <Row key={label} index={i + 1} label={label} value={value} />
              ))}
            </tbody>
          </table>
          <p className="text-xs leading-relaxed">
            Certified that the above information is in accordance with the school records. {c.studentName} has no
            dues outstanding to the school as per the records on the date of issue{c.conduct ? `, and his/her conduct during the stay in the school was ${c.conduct.toLowerCase()}` : ''}.
          </p>
        </>
      ) : (
        <div className="space-y-4 text-sm leading-7">
          <p>
            This is to certify that <span className="font-bold">{c.studentName}</span>
            {ward} admission no. <span className="font-bold">{c.studentId}</span>, is a bonafide student of this school,
            studying in Class <span className="font-bold">{c.className}</span>
            {c.academicYear ? (
              <>
                {' '}during the academic session <span className="font-bold">{c.academicYear}</span>
              </>
            ) : null}
            .
          </p>
          <p>
            According to the school records, his/her date of birth is{' '}
            <span className="font-bold">{fmt(c.dateOfBirth)}</span> and he/she was admitted to the school on{' '}
            <span className="font-bold">{fmt(c.admissionDate)}</span>.
          </p>
          {c.conduct && (
            <p>
              His/her conduct is <span className="font-bold">{c.conduct.toLowerCase()}</span>.
            </p>
          )}
          <p>
            This certificate is issued on request{c.reason ? (
              <>
                {' '}for the purpose of <span className="font-bold">{c.reason}</span>
              </>
            ) : null}
            .
          </p>
          {c.remarks && <p className="text-xs text-slate-600">Remarks: {c.remarks}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-10 pt-16 text-xs text-slate-600">
        <div className="text-left">
          <p className="font-semibold">Date: {fmt(c.issuedOn)}</p>
          {c.issuedBy && <p className="mt-2 text-[10px]">Prepared by: {c.issuedBy}</p>}
        </div>
        <div className="text-center self-end">
          <div className="border-t border-slate-400 pt-2 font-bold">Principal</div>
          {school?.principalName && <p className="text-[10px] font-medium">{school.principalName}</p>}
          <p className="text-[10px]">(Signature with school seal)</p>
        </div>
      </div>
    </div>
  );
};

/** Loads and shows certificate `certificateId`. */
export const CertificateSheet = ({ certificateId }) => {
  const state = useApi(certificateId ? `/certificates/${encodeURIComponent(certificateId)}` : null);
  if (!certificateId) return null;
  return (
    <AsyncState state={state} loadingText="Loading certificate…">
      {(data) => <CertificateContent certificate={data.certificate} school={data.school} />}
    </AsyncState>
  );
};

export default CertificateSheet;
