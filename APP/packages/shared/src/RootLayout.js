import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect } from 'react';

import { AuthProvider, useAuth } from './auth';
import { LanguageProvider, useT } from './i18n';
import { NotificationLinksContext, routeForLink } from './notifications';
import { usePushNotificationLinks } from './push';
import { stackScreenOptions } from './theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Builds an app's root layout: signed-out users only see `login`; signed-in users see the `(tabs)` group
 * plus the extra stack screens listed in `screens` ([{ name, title }]; titles are translated with t()). `Wrapper` is an optional
 * provider placed inside the auth provider (e.g. the Parent app's selected child). `notificationLinks`
 * maps the backend's notification links to this app's routes ({ '/fees': '/fees', ... }); used by the
 * notification list and when a push notification is tapped.
 */
export function createRootLayout({ role, screens = [], Wrapper = Fragment, notificationLinks = {} }) {
  function RootNavigator() {
    const { user, isLoading } = useAuth();
    const t = useT();
    const mustChange = Boolean(user?.mustChangePassword);

    usePushNotificationLinks(!!user && !mustChange, (link) => {
      const route = routeForLink(link, notificationLinks) ?? '/notifications';
      // Let the signed-in stack mount first when the tap launched the app.
      setTimeout(() => {
        try {
          router.push(route);
        } catch {
          // navigator not ready; the notification is still in the in-app list
        }
      }, 250);
    });

    useEffect(() => {
      if (!isLoading) SplashScreen.hideAsync().catch(() => {});
    }, [isLoading]);

    return (
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Protected guard={!!user && !mustChange}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {screens.map((screen) => (
            <Stack.Screen key={screen.name} name={screen.name} options={{ title: t(screen.title) }} />
          ))}
        </Stack.Protected>
        {/* Reachable from Profile, and the only screen until a temporary password is replaced. */}
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="change-password" options={{ title: t('Change password') }} />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    );
  }

  return function RootLayout() {
    return (
      <LanguageProvider>
        <AuthProvider role={role}>
          <StatusBar style="dark" />
          <NotificationLinksContext.Provider value={notificationLinks}>
            <Wrapper>
              <RootNavigator />
            </Wrapper>
          </NotificationLinksContext.Provider>
        </AuthProvider>
      </LanguageProvider>
    );
  };
}
