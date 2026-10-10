import { FeesScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../../child';

export default function Fees() {
  const { child } = useChild();
  return child ? <FeesScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} canDeposit /> : null;
}
