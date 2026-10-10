import { HealthScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

/** Parents can update allergies, medicines, conditions and the emergency contact. */
export default function Health() {
  const { child } = useChild();
  return child ? <HealthScreen key={child.id} studentId={child.id} canEdit header={<ChildSwitcher />} /> : null;
}
