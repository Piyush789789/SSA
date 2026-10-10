import { LeaveRequestsScreen } from '@ssa/shared';

/** Leave applications from students of the teacher's classes. */
export default function LeaveRequests() {
  return <LeaveRequestsScreen types={['STUDENT']} />;
}
