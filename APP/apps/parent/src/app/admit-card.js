import { AdmitCardScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function AdmitCard() {
  const { child } = useChild();
  return child ? (
    <AdmitCardScreen key={child.id} studentId={child.id} className={child.className} header={<ChildSwitcher />} />
  ) : null;
}
