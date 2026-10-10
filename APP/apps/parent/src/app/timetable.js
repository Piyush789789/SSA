import { TimetableScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Timetable() {
  const { child } = useChild();
  return child ? <TimetableScreen key={child.id} className={child.className} header={<ChildSwitcher />} /> : null;
}
