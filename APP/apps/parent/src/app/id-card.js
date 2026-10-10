import { IdCardScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function IdCard() {
  const { child } = useChild();
  return child ? <IdCardScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} /> : null;
}
