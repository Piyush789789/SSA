import { Text } from 'react-native';

import { formatDate } from '../format';
import { useApi } from '../useApi';
import { Badge, Card, Empty, Loaded, Screen, styles } from '../ui';

export function NoticesScreen() {
  const state = useApi('/notices');
  return (
    <Screen refreshing={state.refreshing} onRefresh={state.reload}>
      <Loaded state={state}>
        {(notices) =>
          notices.length === 0 ? (
            <Empty text="No notices yet." icon="megaphone-outline" />
          ) : (
            notices.map((notice) => (
              <Card key={notice.id} title={notice.title} right={<Badge label={notice.priority} />}>
                <Text style={styles.body}>{notice.description}</Text>
                <Text style={[styles.muted, { marginTop: 8 }]}>
                  {notice.authorName} · {formatDate(notice.createdAt)}
                </Text>
              </Card>
            ))
          )
        }
      </Loaded>
    </Screen>
  );
}
