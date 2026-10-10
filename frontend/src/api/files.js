import apiClient from './apiClient';
import { ApiError } from './http';

/** Turns an axios error into an ApiError with the server's message (also when the error body is a Blob). */
async function toApiError(err) {
  if (!err.response) {
    return new ApiError('Cannot reach the server. Check that the backend is running on port 8080.', 0);
  }
  let message = null;
  const data = err.response.data;
  if (data instanceof Blob) {
    try {
      message = JSON.parse(await data.text())?.message ?? null;
    } catch {
      message = null;
    }
  } else {
    message = data?.message ?? null;
  }
  return new ApiError(message || `Request failed (${err.response.status})`, err.response.status);
}

/** Uploads one file (multipart field "file") with the signed-in user's token → {id, fileName, contentType, sizeBytes}. */
export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  try {
    // Content-Type multipart/form-data lets the browser add the boundary (the client's default is JSON).
    const response = await apiClient.post('/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data?.data ?? response.data;
  } catch (err) {
    throw await toApiError(err);
  }
}

/** POST like http.post, but with a long timeout for slow server work (e.g. importing hundreds of students). */
export async function postSlow(path, body, timeout = 180000) {
  try {
    const response = await apiClient.post(path, body, { timeout });
    const payload = response.data;
    return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  } catch (err) {
    throw await toApiError(err);
  }
}

/** GETs a protected file (Bearer header) as a Blob. `<img src>` cannot send the header, so use an object URL. */
export async function fetchBlob(path) {
  try {
    const response = await apiClient.get(path, { responseType: 'blob', timeout: 60000 });
    return response.data;
  } catch (err) {
    throw await toApiError(err);
  }
}

/** Downloads a protected file and saves it with `fileName`. */
export async function downloadFile(path, fileName) {
  const blob = await fetchBlob(path);
  saveBlob(blob, fileName);
}

/** Offers a Blob to the user as a download. */
export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
