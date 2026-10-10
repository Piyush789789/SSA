import { HomeworkScreen, useAuth } from '@ssa/shared';

export default function Homework() {
  const { profile } = useAuth();
  return profile ? <HomeworkScreen className={profile.className} studentId={profile.id} /> : null;
}
