import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { AtRiskView } from '@/components/insights/AtRisk';
import { useI18n } from '@/i18n/translate';

/** /teacher/at-risk — students of my classes who may need help. */
export const TeacherAtRiskPage = () => {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader icon={AlertTriangle} title={t('nav.atRisk')} description={t('atRisk.teacherDescription')} />
      <AtRiskView classes={currentUser?.assignedClasses ?? []} profileBase="/teacher/students" />
    </div>
  );
};

export default TeacherAtRiskPage;
