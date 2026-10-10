import { LeaveRequestsScreen } from '@ssa/shared';

/** Staff and student leave applications to approve or reject. */
export default function LeaveRequests() {
  return <LeaveRequestsScreen types={['STAFF', 'STUDENT']} />;
}
