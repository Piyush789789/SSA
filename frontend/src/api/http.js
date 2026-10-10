import apiClient from './apiClient';

/** Error from the backend, carrying its message (e.g. "Marks for Rohit exceed the maximum of 50") and HTTP status. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function send(method, path, body) {
  try {
    const response = await apiClient.request({ method, url: path, data: body });
    const payload = response.data;
    // Most endpoints wrap their result as { success, message, data }.
    return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  } catch (err) {
    if (!err.response) {
      throw new ApiError('Cannot reach the server. Check that the backend is running on port 8080.', 0);
    }
    throw new ApiError(err.response.data?.message || `Request failed (${err.response.status})`, err.response.status);
  }
}

/** Thin wrapper over the backend REST API. Paths are relative to /api, e.g. http.get('/students'). */
export const http = {
  get: (path) => send('get', path),
  post: (path, body) => send('post', path, body),
  put: (path, body) => send('put', path, body),
  delete: (path) => send('delete', path),
};

/** Builds "path?key=value&..." skipping empty values: withQuery('/attendance', { className: '5-B', date }) */
export function withQuery(path, params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return query ? `${path}?${query}` : path;
}
