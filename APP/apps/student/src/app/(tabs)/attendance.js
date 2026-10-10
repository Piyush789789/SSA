import { AttendanceScreen, useAuth } from '@ssa/shared';

export default function Attendance() {
  const { profile } = useAuth();
  return profile ? <AttendanceScreen studentId={profile.id} /> : null;
}
