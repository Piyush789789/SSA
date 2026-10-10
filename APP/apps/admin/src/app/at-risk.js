import { AtRiskScreen, useApi } from '@ssa/shared';
import { router } from 'expo-router';

/** Students needing attention across the school (or one class); tap to open the profile. */
export default function AtRisk() {
  const classes = useApi('/classes');
  const ids = (classes.data ?? []).filter((c) => c.studentCount > 0).map((c) => c.id);
  return <AtRiskScreen classes={ids} onOpen={(s) => router.push(`/student/${s.studentId}`)} />;
}
