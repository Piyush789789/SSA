import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect } from 'react';

import { AuthProvider, useAuth } from './auth';
import { stackScreenOptions } from './theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Builds an app's root layout: signed-out users only see `login`; signed-in users see the `(tabs)` group
 * plus the extra stack screens listed in `screens` ([{ name, title }]). `Wrapper` is an optional
 * provider placed inside the auth provider (e.g. the Parent app's selected child).
 */
export function createRootLayout({ role, screens = [], Wrapper = Fragment }) {
  function RootNavigator() {
    const { user, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading) SplashScreen.hideAsync().catch(() => {});
    }, [isLoading]);

    return (
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {screens.map((screen) => (
            <Stack.Screen key={screen.name} name={screen.name} options={{ title: screen.title }} />
          ))}
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    );
  }

  return function RootLayout() {
    return (
      <AuthProvider role={role}>
        <StatusBar style="dark" />
        <Wrapper>
          <RootNavigator />
        </Wrapper>
      </AuthProvider>
    );
  };
}
