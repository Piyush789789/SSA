import { LibraryScreen, useAuth } from '@ssa/shared';

export default function Library() {
  const { profile } = useAuth();
  return profile ? <LibraryScreen studentId={profile.id} /> : null;
}
