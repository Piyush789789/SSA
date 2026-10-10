import { HomeworkScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Homework() {
  const { child } = useChild();
  return child ? (
    <HomeworkScreen key={child.id} className={child.className} studentId={child.id} header={<ChildSwitcher />} />
  ) : null;
}
