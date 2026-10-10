import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { useAuth } from '../auth';
import { formatDateTime } from '../format';
import { actorIdOf, useApi } from '../useApi';
import { Badge, Button, Card, Empty, Loaded, Screen, styles } from '../ui';

/** Inbox plus sent messages. "New message" opens the `compose` route, which every app defines. */
export function MessagesScreen() {
  const { user } = useAuth();
  const state = useApi('/messages');
  const [expanded, setExpanded] = useState(null);

  return (
    <Screen
      refreshing={state.refreshing}
      onRefresh={state.reload}
      footer={<Button title="New message" icon="create-outline" onPress={() => router.push('/compose')} />}
    >
      <Loaded state={state}>
        {(messages) =>
          messages.length === 0 ? (
            <Empty text="No messages yet." icon="chatbubbles-outline" />
          ) : (
            messages.map((message) => {
              const sentByMe = message.senderId === actorIdOf(user);
              const open = expanded === message.id;
              return (
                <Card
                  key={message.id}
                  title={message.subject}
                  right={sentByMe ? <Badge label="Sent" tone="neutral" /> : null}
                  onPress={() => setExpanded(open ? null : message.id)}
                >
                  <Text style={styles.muted}>
                    {sentByMe ? `To ${message.recipientName}` : `From ${message.senderName}`} ·{' '}
                    {formatDateTime(message.sentAt)}
                  </Text>
                  <Text style={[styles.body, { marginTop: 6 }]} numberOfLines={open ? undefined : 2}>
                    {message.body}
                  </Text>
                </Card>
              );
            })
          )
        }
      </Loaded>
    </Screen>
  );
}
