import { IdCardScreen, useAuth } from '@ssa/shared';

export default function IdCard() {
  const { profile } = useAuth();
  return profile ? <IdCardScreen studentId={profile.id} /> : null;
}
