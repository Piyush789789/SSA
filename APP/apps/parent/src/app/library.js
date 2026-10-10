import { LibraryScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Library() {
  const { child } = useChild();
  return child ? <LibraryScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} /> : null;
}
