import { AdmitCardScreen, useAuth } from '@ssa/shared';

export default function AdmitCard() {
  const { profile } = useAuth();
  return profile ? <AdmitCardScreen studentId={profile.id} className={profile.className} /> : null;
}
