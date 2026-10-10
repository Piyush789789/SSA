import { ResultsScreen, useAuth } from '@ssa/shared';

export default function Results() {
  const { profile } = useAuth();
  return profile ? <ResultsScreen studentId={profile.id} /> : null;
}
