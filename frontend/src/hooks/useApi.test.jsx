import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@/api/http', () => ({ http: { get: vi.fn() } }));
const { http } = await import('@/api/http');
const { useApi } = await import('./useApi');

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useApi', () => {
  beforeEach(() => {
    vi.mocked(http.get).mockReset();
  });

  it('loads data', async () => {
    vi.mocked(http.get).mockResolvedValue([1, 2]);
    const { result } = renderHook(() => useApi('/students'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual([1, 2]));
    expect(result.current.loading).toBe(false);
    expect(http.get).toHaveBeenCalledWith('/students');
  });

  it('skips a null path', () => {
    const { result } = renderHook(() => useApi(null));
    expect(result.current).toMatchObject({ data: null, error: null, loading: false });
    expect(http.get).not.toHaveBeenCalled();
  });

  it('stops loading when the server answers with no data (null)', async () => {
    vi.mocked(http.get).mockResolvedValue(null);
    const { result } = renderHook(() => useApi('/transport/students/S1'));
    await waitFor(() => expect(http.get).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('reports errors', async () => {
    vi.mocked(http.get).mockImplementation(() => Promise.reject(new Error('Boom')));
    const { result } = renderHook(() => useApi('/x'));
    await waitFor(() => expect(result.current.error?.message).toBe('Boom'));
    expect(result.current.loading).toBe(false);
  });

  it('never shows data of the previous path, and ignores late answers', async () => {
    const first = deferred();
    const second = deferred();
    vi.mocked(http.get).mockImplementation((path) => (path === '/a' ? first.promise : second.promise));
    const { result, rerender } = renderHook(({ path }) => useApi(path), { initialProps: { path: '/a' } });
    rerender({ path: '/b' });
    expect(result.current.loading).toBe(true);
    await act(async () => second.resolve('B'));
    expect(result.current.data).toBe('B');
    await act(async () => first.resolve('A')); // stale answer
    expect(result.current.data).toBe('B');
  });

  it('keeps old data when a reload fails', async () => {
    vi.mocked(http.get).mockResolvedValueOnce('v1').mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useApi('/x'));
    await waitFor(() => expect(result.current.data).toBe('v1'));
    await act(async () => result.current.reload());
    expect(result.current.data).toBe('v1');
    expect(result.current.error.message).toBe('offline');
  });

  it('setData updates locally', async () => {
    vi.mocked(http.get).mockResolvedValue([1]);
    const { result } = renderHook(() => useApi('/x'));
    await waitFor(() => expect(result.current.data).toEqual([1]));
    act(() => result.current.setData((list) => [...list, 2]));
    expect(result.current.data).toEqual([1, 2]);
    act(() => result.current.setData([]));
    expect(result.current.data).toEqual([]);
  });
});
