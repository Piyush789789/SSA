import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Phone push notifications (expo-notifications). Everything here fails silently: push is a convenience,
 * the in-app notification list always works.
 *
 * Remote push is not available in Expo Go on Android (since SDK 53) — it needs a development build or an
 * installed APK — so the module is not even loaded there. Getting an Expo push token also needs the app's
 * EAS project id (`npx eas-cli@latest init`); without one, registration is skipped.
 */
function loadNotifications() {
  if (Platform.OS === 'web') return null;
  if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') return null; // Expo Go
  try {
    // Loaded lazily so Expo Go on Android never touches the push APIs.
    return require('expo-notifications');
  } catch {
    return null;
  }
}

let handlerSet = false;

function ensureForegroundHandler(Notifications) {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission and returns this device's Expo push token, or null when push is unavailable. */
export async function getExpoPushToken() {
  try {
    const Notifications = loadNotifications();
    if (!Notifications || !Device.isDevice) return null;
    ensureForegroundHandler(Notifications);

    // Android 13+: a channel must exist before asking, or the permission prompt does not appear.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'School updates',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const result = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return result?.data ?? null;
  } catch {
    return null;
  }
}

const handledResponses = new Set();

/**
 * While `enabled` (signed in), opens the screen linked to a tapped push notification — including the one
 * that launched the app. `onLink` receives the notification's `data.link` (e.g. "/fees").
 */
export function usePushNotificationLinks(enabled, onLink) {
  const onLinkRef = useRef(onLink);
  onLinkRef.current = onLink;

  useEffect(() => {
    if (!enabled) return undefined;
    const Notifications = loadNotifications();
    if (!Notifications) return undefined;

    function open(response) {
      const request = response?.notification?.request;
      if (!request || handledResponses.has(request.identifier)) return;
      handledResponses.add(request.identifier);
      const link = request.content?.data?.link;
      if (link) onLinkRef.current(link);
    }

    let active = true;
    Notifications.getLastNotificationResponseAsync?.()
      .then((response) => {
        if (active) open(response);
      })
      .catch(() => {});
    let subscription;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener(open);
    } catch {
      subscription = null;
    }
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [enabled]);
}
