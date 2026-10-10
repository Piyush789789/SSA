import { TransportScreen, useAuth } from '@ssa/shared';

export default function Bus() {
  const { profile } = useAuth();
  return profile ? <TransportScreen studentId={profile.id} /> : null;
}
