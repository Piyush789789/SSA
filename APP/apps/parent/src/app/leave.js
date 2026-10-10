import { LeaveScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Leave() {
  const { child } = useChild();
  return child ? <LeaveScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} /> : null;
}
