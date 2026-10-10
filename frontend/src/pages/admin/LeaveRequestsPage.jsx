import React, { useState } from 'react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState } from '@/components/common/AsyncState';
import { LeaveList } from '@/components/leaves/Leaves';
import { pendingFirst } from '@/components/leaves/leaveUtils';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';

const TYPES = [
  { id: 'STAFF', label: 'Staff' },
  { id: 'STUDENT', label: 'Students' },
];
const STATUSES = [
  { id: '', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
];

/** /admin/leaves — staff and student leave applications with Approve / Reject. */
export const LeaveRequestsPage = () => {
  const [type, setType] = useState('STAFF');
  const [status, setStatus] = useState('PENDING');
  const leaves = useApi(withQuery('/leaves', { type, status }));

  return (
    <AdminPageShell
      activeItemId="leaves"
      title="Leave Requests"
      description="Approve or reject leave. Approved days are marked as leave in student or staff attendance."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold border cursor-pointer ${
                type === t.id ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
          {STATUSES.map((s) => (
            <button
              key={s.id || 'all'}
              type="button"
              onClick={() => setStatus(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                status === s.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AsyncState state={leaves} loadingText="Loading leave requests…">
          {(list) => (
            <LeaveList
              leaves={pendingFirst(list)}
              showPerson
              canDecide={() => true}
              onChanged={leaves.reload}
              emptyText={status === 'PENDING' ? 'No pending leave requests.' : 'No leave applications.'}
            />
          )}
        </AsyncState>
      </div>
    </AdminPageShell>
  );
};

export default LeaveRequestsPage;
