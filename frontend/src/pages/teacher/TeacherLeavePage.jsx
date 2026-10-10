import React, { useState } from 'react';
import { CalendarMinus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { AsyncState } from '@/components/common/AsyncState';
import { LeaveApplyForm, LeaveList } from '@/components/leaves/Leaves';
import { pendingFirst } from '@/components/leaves/leaveUtils';
import { useI18n } from '@/i18n/translate';

/** /teacher/leave — the teacher's own staff leave, and leave requests from students of their classes. */
export const TeacherLeavePage = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('students');
  const { tx } = useI18n();
  const staffLeaves = useApi(withQuery('/leaves', { type: 'STAFF' }));
  const studentLeaves = useApi(withQuery('/leaves', { type: 'STUDENT' }));
  const pendingCount = (studentLeaves.data ?? []).filter((l) => l.status === 'PENDING').length;

  const tabs = [
    {
      id: 'students',
      label: `${tx('Student leave requests')}${pendingCount ? ` (${tx('{count} pending', { count: pendingCount })})` : ''}`,
    },
    { id: 'mine', label: tx('My leave') },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <CalendarMinus className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>{tx('Leave')}</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Approve leave for students of your classes, and apply for your own leave (approved by the school admin).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold border cursor-pointer ${
              tab === t.id ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Student leave requests</h2>
            <p className="text-xs text-slate-500">Approving marks the student on leave for the school days in the range.</p>
          </div>
          <AsyncState state={studentLeaves} loadingText="Loading requests…">
            {(list) => (
              <LeaveList
                leaves={pendingFirst(list)}
                showPerson
                canDecide={(l) => (currentUser?.assignedClasses ?? []).includes(l.className)}
                onChanged={studentLeaves.reload}
                emptyText="No leave requests from your students."
              />
            )}
          </AsyncState>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <LeaveApplyForm onApplied={staffLeaves.reload} />
          </div>
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">My applications</h2>
            </div>
            <AsyncState state={staffLeaves} loadingText="Loading applications…">
              {(list) => (
                <LeaveList
                  leaves={(list ?? []).filter((l) => l.personId === currentUser?.teacherId)}
                  onChanged={staffLeaves.reload}
                />
              )}
            </AsyncState>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLeavePage;
