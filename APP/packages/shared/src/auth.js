import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, setAuthToken, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);

/**
 * Keeps the session for one app. `role` is fixed per app (each role has its own app), so an account of
 * another role is refused at login. The token is kept in the device's secure storage.
 */
export function AuthProvider({ role, children }) {
  const storageKey = `ssa_token_${role.toLowerCase()}`;
  const [session, setSession] = useState(null); // { token, user, profile, children }
  const [isLoading, setLoading] = useState(true);

  const signOut = useCallback(
    async ({ remote = true } = {}) => {
      if (remote) {
        api('/auth/logout', { method: 'POST' }).catch(() => {});
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
