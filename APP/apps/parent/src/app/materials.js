import { MaterialsScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Materials() {
  const { child } = useChild();
  return child ? <MaterialsScreen key={child.id} className={child.className} header={<ChildSwitcher />} /> : null;
}
