import { FeesScreen, useAuth } from '@ssa/shared';

export default function Fees() {
  const { profile } = useAuth();
  return profile ? <FeesScreen studentId={profile.id} canDeposit /> : null;
}
