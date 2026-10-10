import React from 'react';
import { IdCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { PageHeader } from '@/components/common/PageHeader';
import { IdCardsManager } from '@/components/idcards/IdCards';
import { useI18n } from '@/i18n/translate';

/** /teacher/id-cards — ID cards of the classes I am class teacher of. */
export const TeacherIdCardsPage = () => {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const classes = useApi('/classes');

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader icon={IdCard} title={t('nav.idCards')} description={t('idcards.teacherDescription')} />
      </div>
      <AsyncState state={classes} loadingText={t('idcards.loadingClasses')}>
        {(list) => (
          <IdCardsManager
            classes={(list ?? []).filter((c) => c.classTeacherId === currentUser?.teacherId).map((c) => c.id)}
          />
        )}
      </AsyncState>
    </div>
  );
};

export default TeacherIdCardsPage;
