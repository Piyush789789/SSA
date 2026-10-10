import React from 'react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AtRiskView } from '@/components/insights/AtRisk';
import { useApi } from '@/hooks/useApi';
import { useI18n } from '@/i18n/translate';

/** /admin/at-risk — early warning list for the whole school or one class. */
export const AtRiskPage = () => {
  const { t } = useI18n();
  const classes = useApi('/classes');
  return (
    <AdminPageShell activeItemId="at-risk" title={t('nav.atRisk')} description={t('atRisk.description')}>
      <AtRiskView classes={(classes.data ?? []).map((c) => c.id)} profileBase="/admin/students" />
    </AdminPageShell>
  );
};

export default AtRiskPage;
