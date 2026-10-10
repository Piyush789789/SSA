import { Card, Loaded, Screen, StudentOverview, styles, useApi, useAuth, useT } from '@ssa/shared';
import { Text } from 'react-native';

export default function Home() {
  const { profile } = useAuth();
  const t = useT();
  const state = useApi('/dashboard');

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Card>
        <Text style={[styles.cardTitle, { fontSize: 20 }]}>{t('Hello')}, {profile?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.muted}>
          Class {profile?.className} · Roll no. {profile?.rollNumber}
        </Text>
      </Card>
      <Loaded state={state}>{(overview) => <StudentOverview overview={overview} />}</Loaded>
    </Screen>
  );
}
