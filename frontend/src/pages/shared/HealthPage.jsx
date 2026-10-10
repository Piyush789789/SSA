import React from 'react';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyMessage } from '@/components/common/AsyncState';
import { HealthPanel } from '@/components/health/HealthPanel';
import { useI18n } from '@/i18n/translate';

/** /student/health (read only) and /parent/health (the selected child; parents can edit allergies and medicines). */
export const HealthPage = () => {
  const { t } = useI18n();
  const { role, currentUser, selectedChild } = useAuth();
  const isParent = role === 'parent';
  const student = isParent ? selectedChild : currentUser;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={HeartPulse}
        title={t('nav.health')}
        description={
          isParent && student
            ? t('health.parentDescription', { name: student.name })
            : t('health.studentDescription')
        }
      />
      {student ? (
        <HealthPanel
          key={student.studentId}
          studentId={student.studentId}
          studentName={student.name}
          mode={isParent ? 'parent' : 'student'}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <EmptyMessage text={t('common.noChild')} />
        </div>
      )}
    </div>
  );
};

export default HealthPage;
