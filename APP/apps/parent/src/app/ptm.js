import { PtmBookingScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Ptm() {
  const { child } = useChild();
  return child ? (
    <PtmBookingScreen key={child.id} studentId={child.id} studentName={child.name} header={<ChildSwitcher />} />
  ) : null;
}
