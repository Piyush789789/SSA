import React from 'react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState } from '@/components/common/AsyncState';
import { IdCardsManager } from '@/components/idcards/IdCards';
import { useApi } from '@/hooks/useApi';
import { useI18n } from '@/i18n/translate';

/** /admin/id-cards — student ID cards per class (and staff cards), photo upload and printing, 8 per A4. */
export const IdCardsAdminPage = () => {
  const { t } = useI18n();
  const classes = useApi('/classes');
  return (
    <AdminPageShell activeItemId="id-cards" title={t('nav.idCards')} description={t('idcards.description')}>
      <AsyncState state={classes} loadingText={t('idcards.loadingClasses')}>
        {(list) => <IdCardsManager classes={(list ?? []).map((c) => c.id)} allowTeachers />}
      </AsyncState>
    </AdminPageShell>
  );
};

export default IdCardsAdminPage;
