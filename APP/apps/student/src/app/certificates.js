import { CertificatesScreen, useAuth } from '@ssa/shared';

export default function Certificates() {
  const { profile } = useAuth();
  return profile ? <CertificatesScreen studentId={profile.id} /> : null;
}
