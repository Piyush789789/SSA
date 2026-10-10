import React from 'react';
import { CalendarMinus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { LeaveApplyForm, LeaveList } from '@/components/leaves/Leaves';
import { useI18n } from '@/i18n/translate';

/**
 * /student/leave and /parent/leave — apply for leave and follow the applications. Parents apply for the
 * selected child.
 */
export const FamilyLeavePage = () => {
  const { currentUser, role, selectedChild } = useAuth();
  const { tx } = useI18n();
  const isParent = role === 'parent';
  const student = isParent ? selectedChild : currentUser;
  const leaves = useApi('/leaves');

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <CalendarMinus className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>{tx('Leave Applications')}</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Apply for leave{isParent && student ? ` for ${student.name}` : ''}. The class teacher approves or rejects it;
          approved days are marked as leave in attendance.
        </p>
      </div>

      {!student ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <EmptyMessage text="No child is linked to your account." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <LeaveApplyForm
              key={student.studentId}
              studentId={isParent ? student.studentId : undefined}
              forName={isParent ? `${student.name} (Class ${student.className})` : undefined}
              onApplied={leaves.reload}
            />
          </div>
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">My applications</h2>
            </div>
            <AsyncState state={leaves} loadingText="Loading applications…">
              {(list) => (
                <LeaveList
                  leaves={(list ?? []).filter((l) => l.personId === student.studentId)}
                  onChanged={leaves.reload}
                />
              )}
            </AsyncState>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyLeavePage;
