import { TransportScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Bus() {
  const { child } = useChild();
  return child ? <TransportScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} /> : null;
}
