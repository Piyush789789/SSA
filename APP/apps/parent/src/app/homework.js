import { HomeworkScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Homework() {
  const { child } = useChild();
  return child ? <HomeworkScreen key={child.id} className={child.className} header={<ChildSwitcher />} /> : null;
}
