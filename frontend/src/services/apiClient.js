import { APP_CONFIG } from '@/config/env';

export async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
