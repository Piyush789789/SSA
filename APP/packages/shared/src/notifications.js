import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { createContext, useCallback, useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from './api';
import { colors } from './theme';

const POLL_MS = 60000;

/**
 * Each app maps the backend's notification links ("/fees", "/attendance", "/results", "/homework",
 * "/notices", "/messages") to its own routes, passed to createRootLayout({ notificationLinks }).
 */
export const NotificationLinksContext = createContext({});

export function useNotificationLinks() {
  return useContext(NotificationLinksContext);
}

/** "/fees?x=1" or "/messages/42" -> the app's route for "/fees" / "/messages", or null if it has none. */
export function routeForLink(link, links) {
  if (!link || !links) return null;
  const path = String(link).split(/[?#]/)[0];
  const first = `/${path.split('/').filter(Boolean)[0] ?? ''}`;
  return links[path] ?? links[first] ?? null;
}

/** Bell with an unread badge for a screen header. Refreshes when the screen is focused and every minute. */
export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = () =>
        api('/notifications/unread-count')
          .then((data) => {
            if (active) setUnread(data?.unread ?? 0);
          })
          .catch(() => {});
      load();
      const timer = setInterval(load, POLL_MS);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );

  const label = unread > 99 ? '99+' : String(unread);
  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      style={({ pressed }) => [bellStyles.bell, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={unread > 0 ? 'notifications' : 'notifications-outline'} size={24} color={colors.text} />
      {unread > 0 ? (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** For Tabs.Screen options: `headerRight: notificationBell`. */
export function notificationBell() {
  return <NotificationBell />;
}

const bellStyles = StyleSheet.create({
  bell: { marginHorizontal: 16, padding: 2 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
