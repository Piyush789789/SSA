import { ResultsScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../../child';

export default function Results() {
  const { child } = useChild();
  return child ? <ResultsScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} /> : null;
}
