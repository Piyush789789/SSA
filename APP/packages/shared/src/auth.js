import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { api, getAuthToken, setAuthToken, setUnauthorizedHandler } from './api';
import { getExpoPushToken } from './push';

const AuthContext = createContext(null);

/**
 * Keeps the session for one app. `role` is fixed per app (each role has its own app), so an account of
 * another role is refused at login. The token is kept in the device's secure storage.
 */
export function AuthProvider({ role, children }) {
  const storageKey = `ssa_token_${role.toLowerCase()}`;
  const [session, setSession] = useState(null); // { token, user, profile, children }
  const [isLoading, setLoading] = useState(true);
  const pushTokenRef = useRef(null); // this phone's Expo push token, once registered for the signed-in user

  const signOut = useCallback(
    async ({ remote = true } = {}) => {
      // Stop push notifications to this phone, then end the session (in that order, with the old token).
      const sessionToken = getAuthToken();
      const pushToken = pushTokenRef.current;
      pushTokenRef.current = null;
      const unregister = pushToken
        ? api(`/me/push-token?token=${encodeURIComponent(pushToken)}`, { method: 'DELETE', token: sessionToken }).catch(() => {})
        : Promise.resolve();
      if (remote && sessionToken) {
        unregister.then(() => api('/auth/logout', { method: 'POST', token: sessionToken })).catch(() => {});
      }
      setAuthToken(null);
      setSession(null);
      await SecureStore.deleteItemAsync(storageKey).catch(() => {});
    },
    [storageKey],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => signOut({ remote: false }));
  }, [signOut]);

  const loadSession = useCallback(async (token) => {
    setAuthToken(token);
    const me = await api('/auth/me');
    return { token, user: me.user, profile: me.profile ?? null, children: me.children ?? [] };
  }, []);

  // Restore a saved session on start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(storageKey);
        if (token) {
          const restored = await loadSession(token);
          if (!cancelled) setSession(restored);
        }
      } catch (error) {
        setAuthToken(null);
        if (error.status === 401) {
          await SecureStore.deleteItemAsync(storageKey).catch(() => {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageKey, loadSession]);

  const signIn = useCallback(
    async (email, password) => {
      const result = await api('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password, role },
      });
      const next = await loadSession(result.token);
      await SecureStore.setItemAsync(storageKey, result.token);
      setSession(next);
    },
    [role, storageKey, loadSession],
  );

  // Register this phone for push notifications once signed in. Silently does nothing where push is
  // unavailable (Expo Go on Android, emulators, permission denied, no EAS project id).
  const sessionToken = session?.token;
  useEffect(() => {
    if (!sessionToken) return undefined;
    let cancelled = false;
    (async () => {
      const pushToken = await getExpoPushToken();
      if (!pushToken || cancelled) return;
      try {
        await api('/me/push-token', { method: 'POST', body: { token: pushToken, platform: Platform.OS }, token: sessionToken });
        if (!cancelled) pushTokenRef.current = pushToken;
      } catch {
        // push is optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  /** Re-reads the profile, e.g. after it was edited. */
  const refreshSession = useCallback(async () => {
    if (session?.token) {
      setSession(await loadSession(session.token));
    }
  }, [session, loadSession]);

  const value = useMemo(
    () => ({
      role,
      session,
      user: session?.user ?? null,
      profile: session?.profile ?? null,
      children: session?.children ?? [],
      isLoading,
      signIn,
      signOut,
      refreshSession,
    }),
    [role, session, isLoading, signIn, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
