import { ReportCardScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function ReportCard() {
  const { child } = useChild();
  return child ? <ReportCardScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} /> : null;
}
