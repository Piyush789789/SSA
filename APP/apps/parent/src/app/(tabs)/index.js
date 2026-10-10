import { Card, Empty, Loaded, Screen, StudentOverview, styles, useApi, useAuth, useT } from '@ssa/shared';
import { Text } from 'react-native';

import { ChildSwitcher, useChild } from '../../child';

export default function Home() {
  const { user } = useAuth();
  const t = useT();
  const { child } = useChild();
  const state = useApi('/dashboard');

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Card>
        <Text style={[styles.cardTitle, { fontSize: 20 }]}>{t('Hello')}, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.muted}>
          {child ? `Showing ${child.name} · Class ${child.className}` : 'No children linked to this account'}
        </Text>
      </Card>
      <ChildSwitcher />
      <Loaded state={state}>
        {(dashboard) => {
          const overview = dashboard.children.find((c) => c.student.id === child?.id);
          return overview ? <StudentOverview overview={overview} /> : <Empty text="No data for this child yet." />;
        }}
      </Loaded>
    </Screen>
  );
}
