import { Alert, Image, Pressable, StyleSheet } from 'react-native';

import { ApiError, getAuthToken } from './api';
import { API_URL } from './config';
import { colors } from './theme';

const UPLOAD_TIMEOUT_MS = 60000;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Lets the user take a photo or pick several from the gallery. Returns [{ key, uri, name, type, size }]
 * ready for uploadFile (empty when cancelled or permission is refused); photos over 5 MB are dropped and
 * reported through `onSkipped(count)`. expo-image-picker is required lazily so apps without its native
 * module still start.
 */
export async function pickPhotos({ fromCamera = false, limit = 10, prefix = 'photo', onSkipped } = {}) {
  if (limit <= 0) return [];
  const ImagePicker = require('expo-image-picker');
  const permission = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', fromCamera ? 'Allow camera access to take photos.' : 'Allow photo access to attach pictures.');
    return [];
  }
  const options = { mediaTypes: ['images'], quality: 0.6 };
  const result = fromCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync({ ...options, allowsMultipleSelection: true, selectionLimit: limit });
  if (result.canceled) return [];
  const picked = result.assets.slice(0, limit).map((asset, i) => {
    const type = asset.mimeType ?? 'image/jpeg';
    const subtype = type.split('/')[1];
    const extension = subtype === 'jpeg' ? 'jpg' : subtype ?? 'jpg';
    return {
      key: `${asset.uri}-${Date.now()}-${i}`,
      uri: asset.uri,
      name: asset.fileName ?? `${prefix}-${Date.now()}-${i}.${extension}`,
      type,
      size: asset.fileSize,
    };
  });
  const ok = picked.filter((p) => !(p.size && p.size > MAX_UPLOAD_BYTES));
  if (ok.length < picked.length && onSkipped) onSkipped(picked.length - ok.length);
  return ok;
}

/**
 * Uploads one file (a photo from expo-image-picker, or a PDF) as multipart field "file" to POST /files.
 * `file` is { uri, name, type }. Returns { id, fileName, contentType, sizeBytes }.
 */
export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type });

  const headers = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  let response;
  try {
    // No Content-Type header: fetch sets multipart/form-data with the boundary itself.
    response = await fetch(`${API_URL}/files`, { method: 'POST', headers, body: form, signal: controller.signal });
  } catch {
    throw new ApiError(`Could not upload ${file.name}. Check the connection and try again.`, 0);
  } finally {
    clearTimeout(timer);
  }
  let json = null;
  try {
    json = await response.json();
  } catch {
    // not JSON
  }
  if (!response.ok) {
    throw new ApiError(json?.message || `Upload failed (${response.status})`, response.status);
  }
  return json?.data ?? json;
}

/** Image source for an uploaded file: GET /files/{id} needs the Bearer header. */
export function fileSource(fileId) {
  const token = getAuthToken();
  return { uri: `${API_URL}/files/${fileId}`, headers: token ? { Authorization: `Bearer ${token}` } : undefined };
}

/** A square thumbnail of an uploaded photo (or a local picked one via `uri`). */
export function FileThumb({ fileId, uri, size = 72, onPress, style }) {
  const source = uri ? { uri } : fileSource(fileId);
  const image = <Image source={source} style={[local.thumb, { width: size, height: size }, style]} resizeMode="cover" />;
  if (!onPress) return image;
  return (
    <Pressable onPress={onPress} accessibilityRole="imagebutton" accessibilityLabel="Open photo">
      {image}
    </Pressable>
  );
}

const local = StyleSheet.create({
  thumb: { borderRadius: 10, backgroundColor: colors.border },
});
