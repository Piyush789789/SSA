import { TimetableScreen, useAuth } from '@ssa/shared';

export default function Timetable() {
  const { profile } = useAuth();
  return profile ? <TimetableScreen teacherId={profile.id} /> : null;
}
