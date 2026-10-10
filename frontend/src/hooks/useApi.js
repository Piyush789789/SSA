import { useCallback, useEffect, useRef, useState } from 'react';
import { http } from '@/api/http';

/**
 * Loads `path` from the backend (GET) and reloads whenever `path` changes. Pass null to skip.
 *
 *   const { data, loading, error, reload } = useApi(withQuery('/attendance', { className }));
 *
 * Data from a previous path is never shown for a new one, so switching class/child never mixes data.
 */
export function useApi(path) {
  const [result, setResult] = useState({ path: null, data: null, error: null });
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    if (path == null) return;
    const requestId = ++latestRequest.current;
    try {
      const data = await http.get(path);
      if (requestId === latestRequest.current) setResult({ path, data, error: null });
    } catch (error) {
      if (requestId === latestRequest.current) {
        setResult((previous) => ({ path, data: previous.path === path ? previous.data : null, error }));
      }
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  const current = result.path === path ? result : { data: null, error: null };
  const setData = useCallback(
    (updater) =>
      setResult((previous) => ({
        ...previous,
        data: typeof updater === 'function' ? updater(previous.data) : updater,
      })),
    [],
  );

  return {
    data: current.data,
    error: current.error,
    // Loaded once an answer (possibly null, e.g. "no bus assigned") or an error for this path has arrived.
    loading: path != null && result.path !== path,
    reload: load,
    setData,
  };
}
