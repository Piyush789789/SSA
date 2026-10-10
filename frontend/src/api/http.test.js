import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
const post = vi.fn();
const get = vi.fn();
vi.mock('./apiClient', () => ({ default: { request: (...a) => request(...a), post: (...a) => post(...a), get: (...a) => get(...a) } }));

const { ApiError, http, withQuery } = await import('./http');
const { postSlow, fetchBlob } = await import('./files');

beforeEach(() => {
  request.mockReset();
  post.mockReset();
  get.mockReset();
});

describe('withQuery', () => {
  it('returns the bare path without params', () => {
    expect(withQuery('/students')).toBe('/students');
    expect(withQuery('/students', {})).toBe('/students');
  });

  it('skips empty values but keeps 0 and false', () => {
    expect(withQuery('/a', { a: undefined, b: null, c: '', d: 0, e: false })).toBe('/a?d=0&e=false');
  });

  it('encodes keys and values', () => {
    expect(withQuery('/attendance', { className: '5-B', q: 'a&b c', 'x y': 'é' })).toBe(
      '/attendance?className=5-B&q=a%26b%20c&x%20y=%C3%A9',
    );
  });
});

describe('ApiError', () => {
  it('is an Error with a status', () => {
    const e = new ApiError('Nope', 409);
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toBe('Nope');
    expect(e.status).toBe(409);
  });
});

describe('http', () => {
  it('unwraps { success, message, data }', async () => {
    request.mockResolvedValue({ data: { success: true, message: 'ok', data: [1, 2] } });
    await expect(http.get('/students')).resolves.toEqual([1, 2]);
    expect(request).toHaveBeenCalledWith({ method: 'get', url: '/students', data: undefined });
  });

  it('unwraps data: null and falsy data values', async () => {
    request.mockResolvedValue({ data: { success: true, data: null } });
    await expect(http.get('/x')).resolves.toBeNull();
    request.mockResolvedValue({ data: { success: true, data: 0 } });
    await expect(http.get('/x')).resolves.toBe(0);
  });

  it('returns null when the server had no data (it omits a null "data" from the envelope)', async () => {
    request.mockResolvedValue({ data: { success: true } });
    await expect(http.get('/transport/students/S1')).resolves.toBeNull();
    request.mockResolvedValue({ data: { success: true, message: 'Password changed' } });
    await expect(http.post('/auth/change-password')).resolves.toBeNull();
  });

  it('keeps envelopes that carry other fields (e.g. /auth/me)', async () => {
    request.mockResolvedValue({ data: { success: true, user: { id: 'U1' }, profile: null } });
    await expect(http.get('/auth/me')).resolves.toEqual({ success: true, user: { id: 'U1' }, profile: null });
  });

  it('returns unwrapped payloads as they are', async () => {
    request.mockResolvedValue({ data: [{ id: 1 }] });
    await expect(http.get('/x')).resolves.toEqual([{ id: 1 }]);
    request.mockResolvedValue({ data: '' });
    await expect(http.delete('/x')).resolves.toBe('');
    request.mockResolvedValue({ data: null });
    await expect(http.delete('/x')).resolves.toBeNull();
  });

  it('sends bodies with post and put', async () => {
    request.mockResolvedValue({ data: { data: { id: 7 } } });
    await expect(http.post('/notices', { title: 'T' })).resolves.toEqual({ id: 7 });
    expect(request).toHaveBeenLastCalledWith({ method: 'post', url: '/notices', data: { title: 'T' } });
    await http.put('/notices/7', { title: 'U' });
    expect(request).toHaveBeenLastCalledWith({ method: 'put', url: '/notices/7', data: { title: 'U' } });
  });

  it("throws ApiError with the server's message and status", async () => {
    request.mockRejectedValue({ response: { status: 400, data: { message: 'Marks exceed 50' } } });
    await expect(http.post('/x')).rejects.toMatchObject({ message: 'Marks exceed 50', status: 400 });
    await expect(http.post('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('uses a generic message when the server sends none', async () => {
    request.mockRejectedValue({ response: { status: 500, data: '' } });
    await expect(http.get('/x')).rejects.toMatchObject({ message: 'Request failed (500)', status: 500 });
  });

  it('reports network errors with status 0', async () => {
    request.mockRejectedValue(new Error('Network Error'));
    await expect(http.get('/x')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('Cannot reach') });
  });
});

describe('files helpers', () => {
  it('postSlow unwraps and uses a long timeout', async () => {
    post.mockResolvedValue({ data: { data: { total: 3 } } });
    await expect(postSlow('/import/students', { csv: 'a' })).resolves.toEqual({ total: 3 });
    expect(post).toHaveBeenCalledWith('/import/students', { csv: 'a' }, { timeout: 180000 });
  });

  it('reads the error message from a Blob body', async () => {
    const blob = new Blob([JSON.stringify({ message: 'No such file' })], { type: 'application/json' });
    get.mockRejectedValue({ response: { status: 404, data: blob } });
    await expect(fetchBlob('/files/1')).rejects.toMatchObject({ message: 'No such file', status: 404 });
  });

  it('falls back when the Blob is not JSON', async () => {
    get.mockRejectedValue({ response: { status: 502, data: new Blob(['<html>']) } });
    await expect(fetchBlob('/files/1')).rejects.toMatchObject({ message: 'Request failed (502)', status: 502 });
  });
});
