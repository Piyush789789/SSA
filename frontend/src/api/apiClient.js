import axios from 'axios';
import { APP_CONFIG } from '@/config/env';

export const TOKEN_STORAGE_KEY = 'ssa_auth_token';

const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on a signed-in request means the session expired or the backend restarted: sign out everywhere.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = error.config?.headers?.Authorization;
    if (error.response?.status === 401 && sentToken) {
      window.dispatchEvent(new Event('ssa:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
