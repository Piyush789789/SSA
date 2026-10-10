import { HealthScreen, useAuth } from '@ssa/shared';

export default function Health() {
  const { profile } = useAuth();
  return profile ? <HealthScreen studentId={profile.id} /> : null;
}
