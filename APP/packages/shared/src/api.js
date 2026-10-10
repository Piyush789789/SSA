import { API_URL } from './config';

const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

/** Called when a signed-in request gets 401 (session expired or revoked). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/**
 * Calls the Spring Boot backend. Returns the `data` field of `{ success, message, data }` responses
 * (or the whole body for the few endpoints without one) and throws ApiError with the server's message.
 */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      `Cannot reach the server at ${API_URL}. Check that the backend is running and this phone is on the same Wi-Fi.`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // not JSON; fall through with json = null
  }

  if (!response.ok) {
    if (response.status === 401 && headers.Authorization && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(json?.message || `Request failed (${response.status})`, response.status);
  }
  return json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
}
