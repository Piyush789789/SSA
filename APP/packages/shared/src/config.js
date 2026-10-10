import Constants from 'expo-constants';

export const SCHOOL_NAME = 'SSA Shiv Shanti Adarsh Academy';

/**
 * A phone cannot reach the backend at "localhost" (that is the phone itself). During development the
 * backend usually runs on the same computer as the Expo dev server, so reuse that computer's address.
 * Set EXPO_PUBLIC_API_URL (e.g. http://192.168.1.5:8080/api) to override; installed APKs need it.
 */
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:8080/api`;
}

export const API_URL = resolveApiUrl();
