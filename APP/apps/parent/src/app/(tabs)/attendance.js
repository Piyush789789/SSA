import { AttendanceScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../../child';

export default function Attendance() {
  const { child } = useChild();
  return child ? <AttendanceScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} /> : null;
}
