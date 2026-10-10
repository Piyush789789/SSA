import { ReportCardScreen, useAuth } from '@ssa/shared';

export default function ReportCard() {
  const { profile } = useAuth();
  return profile ? <ReportCardScreen studentId={profile.id} /> : null;
}
