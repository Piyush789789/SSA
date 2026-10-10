import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { WhatsAppClassView } from '@/components/whatsapp/WhatsAppClassView';
import { useI18n } from '@/i18n/translate';

/** /teacher/whatsapp — message the families of my classes on WhatsApp. */
export const TeacherWhatsAppPage = () => {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader icon={MessageCircle} title={t('nav.whatsapp')} description={t('wa.pageDescription')} />
      <WhatsAppClassView classes={currentUser?.assignedClasses ?? []} />
    </div>
  );
};

export default TeacherWhatsAppPage;
