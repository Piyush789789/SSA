import React from 'react';
import { Bus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyMessage } from '@/components/common/AsyncState';
import { MyBusCard } from '@/components/transport/MyBusCard';
import { useI18n } from '@/i18n/translate';

/** /student/bus and /parent/bus — the school bus of the student (or the parent's selected child). */
export const MyBusPage = () => {
  const { t } = useI18n();
  const { role, currentUser, selectedChild } = useAuth();
  const student = role === 'parent' ? selectedChild : currentUser;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bus}
        title={t('nav.myBus')}
        description={
          role === 'parent' && student
            ? t('transport.busFor', { name: student.name, className: student.className })
            : t('transport.busDescription')
        }
      />
      {student ? (
        <MyBusCard key={student.studentId} studentId={student.studentId} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <EmptyMessage text={t('common.noChild')} />
        </div>
      )}
    </div>
  );
};

export default MyBusPage;
