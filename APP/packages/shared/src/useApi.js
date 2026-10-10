import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { api } from './api';

/**
 * Loads `path` whenever the screen comes into focus (so data is fresh after returning from a form) and
 * exposes pull-to-refresh. Pass `null` to skip loading until the path is known. When `path` changes,
 * the previous path's data is not shown, so a screen never mixes up two classes or two children.
 */
export function useApi(path) {
  const [result, setResult] = useState({ path: null, data: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const latestRequest = useRef(0);

  const load = useCallback(
    async (isRefresh) => {
      if (path == null) return;
      const requestId = ++latestRequest.current;
      if (isRefresh) setRefreshing(true);
      try {
        const data = await api(path);
        if (requestId === latestRequest.current) setResult({ path, data, error: null });
      } catch (error) {
        if (requestId === latestRequest.current) {
          setResult((previous) => ({ path, data: previous.path === path ? previous.data : null, error }));
        }
      } finally {
        if (requestId === latestRequest.current) setRefreshing(false);
      }
    },
    [path],
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const reload = useCallback(() => load(true), [load]);

  const current = result.path === path ? result : { data: null, error: null };
  return {
    data: current.data,
    error: current.error,
    // Loaded once a response for this path arrived, even when its data is null (e.g. "no bus assigned").
    loading: path != null && result.path !== path,
    refreshing,
    reload,
  };
}

/** Merges several useApi() results into one, for <Loaded> and pull-to-refresh. `data` is the array of their data. */
export function combine(...states) {
  return {
    loading: states.some((s) => s.loading),
    error: states.find((s) => s.error)?.error ?? null,
    data: states.every((s) => s.data != null) ? states.map((s) => s.data) : null,
    refreshing: states.some((s) => s.refreshing),
    reload: () => states.forEach((s) => s.reload()),
  };
}

/** The id the backend uses for the signed-in user as sender/author (their profile id, or user id for admins). */
export function actorIdOf(user) {
  return user?.profileId ?? user?.id;
}
