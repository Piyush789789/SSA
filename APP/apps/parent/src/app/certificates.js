import { CertificatesScreen } from '@ssa/shared';

import { ChildSwitcher, useChild } from '../child';

export default function Certificates() {
  const { child } = useChild();
  return child ? <CertificatesScreen key={child.id} studentId={child.id} header={<ChildSwitcher />} /> : null;
}
