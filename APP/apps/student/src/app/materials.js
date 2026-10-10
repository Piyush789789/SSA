import { MaterialsScreen, useAuth } from '@ssa/shared';

export default function Materials() {
  const { profile } = useAuth();
  return profile ? <MaterialsScreen className={profile.className} /> : null;
}
