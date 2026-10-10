import React from 'react';
import { Landmark } from 'lucide-react';
import { ProtectedImage } from '@/components/common/ProtectedImage';
import { initialsOf } from '@/utils';
import { useI18n } from '@/i18n/translate';

/** Student photo (ID-card photo when uploaded, otherwise initials). */
export const StudentPhoto = ({ student, className = 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl' }) => {
  const initials = (
    <div className={`${className} bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-inner`}>
      {initialsOf(student?.name)}
    </div>
  );
  if (!student?.photoFileId) return initials;
  return <ProtectedImage fileId={student.photoFileId} alt={student.name} className={className} fallback={initials} />;
};

/** "Government records" section: UDISE+ PEN, APAAR ID, RTE quota, social category and parents' names. */
export const GovernmentRecords = ({ student }) => {
  const { t } = useI18n();
  const rows = [
    [t('gov.pen'), student.penNumber],
    [t('gov.apaar'), student.apaarId],
    [t('gov.rte'), student.rte == null ? null : student.rte ? t('common.yes') : t('common.no')],
    [t('gov.category'), student.socialCategory],
    [t('gov.father'), student.fatherName],
    [t('gov.mother'), student.motherName],
  ];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Landmark className="w-5 h-5 text-slate-400" /> {t('gov.title')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-900 break-all">{value || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GovernmentRecords;
