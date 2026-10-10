import React from 'react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { WhatsAppClassView } from '@/components/whatsapp/WhatsAppClassView';
import { useApi } from '@/hooks/useApi';
import { useI18n } from '@/i18n/translate';

/** /admin/whatsapp — message the families of a class on WhatsApp (free click-to-chat links). */
export const WhatsAppPage = () => {
  const { t } = useI18n();
  const classes = useApi('/classes');
  return (
    <AdminPageShell activeItemId="whatsapp" title={t('nav.whatsapp')} description={t('wa.pageDescription')}>
      <WhatsAppClassView classes={(classes.data ?? []).map((c) => c.id)} />
    </AdminPageShell>
  );
};

export default WhatsAppPage;
