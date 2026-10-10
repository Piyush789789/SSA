import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../api';
import { formatDateTime } from '../format';
import { routeForLink, useNotificationLinks } from '../notifications';
import { colors, tones } from '../theme';
import { useApi } from '../useApi';
import { Button, Empty, Loaded, Screen, styles } from '../ui';

const CATEGORY = {
  ATTENDANCE: { icon: 'calendar-outline', tone: 'info' },
  FEES: { icon: 'wallet-outline', tone: 'success' },
  FEE_REMINDER: { icon: 'alarm-outline', tone: 'warning' },
  RESULTS: { icon: 'ribbon-outline', tone: 'primary' },
  HOMEWORK: { icon: 'book-outline', tone: 'info' },
  NOTICE: { icon: 'megaphone-outline', tone: 'primary' },
  MESSAGE: { icon: 'chatbubbles-outline', tone: 'info' },
};

/** The signed-in user's notifications, newest first. Tap one to mark it read and open the related screen. */
export function NotificationsScreen() {
  const state = useApi('/notifications?limit=50');
  const links = useNotificationLinks();
  const [readIds, setReadIds] = useState(() => new Set());
  const [allRead, setAllRead] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const isUnread = (n) => !n.readAt && !allRead && !readIds.has(n.id);

  function open(notification) {
    if (isUnread(notification)) {
      setReadIds((previous) => new Set(previous).add(notification.id));
      api(`/notifications/${notification.id}/read`, { method: 'POST' }).catch(() => {});
    }
    const route = routeForLink(notification.link, links);
    if (route) router.push(route);
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      await api('/notifications/read-all', { method: 'POST' });
      setAllRead(true);
      state.reload();
    } catch (e) {
      Alert.alert('Could not update', e.message);
    } finally {
      setMarkingAll(false);
    }
  }

  function refresh() {
    setReadIds(new Set());
    setAllRead(false);
    state.reload();
  }

  return (
    <Screen refreshing={state.refreshing} onRefresh={refresh}>
      <Loaded state={state}>
        {(list) => {
          if (list.length === 0) return <Empty text="No notifications yet." icon="notifications-outline" />;
          const unreadCount = list.filter(isUnread).length;
          return (
            <>
              {unreadCount > 0 ? (
                <Button
                  title={`Mark all read (${unreadCount})`}
                  icon="checkmark-done-outline"
                  variant="secondary"
                  onPress={markAll}
                  loading={markingAll}
                  style={{ marginBottom: 12 }}
                />
              ) : null}
              {list.map((n) => {
                const unread = isUnread(n);
                const category = CATEGORY[n.category] ?? { icon: 'notifications-outline', tone: 'neutral' };
                const tone = tones[category.tone];
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => open(n)}
                    accessibilityRole="button"
                    style={({ pressed }) => [local.item, unread && local.unreadItem, pressed && styles.pressed]}
                  >
                    <View style={[local.icon, { backgroundColor: tone.bg }]}>
                      <Ionicons name={category.icon} size={20} color={tone.fg} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.body, unread ? local.bold : null]}>{n.title}</Text>
                      {n.body ? (
                        <Text style={[styles.muted, unread && { color: colors.text }]} numberOfLines={3}>
                          {n.body}
                        </Text>
                      ) : null}
                      <Text style={[styles.muted, styles.small, { marginTop: 4 }]}>{formatDateTime(n.createdAt)}</Text>
                    </View>
                    {unread ? <View style={local.dot} accessibilityLabel="Unread" /> : null}
                  </Pressable>
                );
              })}
            </>
          );
        }}
      </Loaded>
    </Screen>
  );
}

const local = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  unreadItem: { borderColor: '#FED7C3', backgroundColor: '#FFFBF8' },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bold: { fontWeight: '800' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 4 },
});
