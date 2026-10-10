import { AtRiskScreen, useAuth } from '@ssa/shared';

/** Students of this teacher's classes who need attention. */
export default function AtRisk() {
  const { profile } = useAuth();
  return <AtRiskScreen classes={profile?.assignedClasses ?? []} />;
}
