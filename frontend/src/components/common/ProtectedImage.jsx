import React, { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { fetchBlob } from '@/api/files';

/**
 * Object URL of an uploaded file (GET /files/{id} with the auth header). `<img src>` cannot send the header,
 * so the file is fetched as a Blob. Returns `{ url, type, error, loading }`; the URL is revoked on unmount.
 */
export function useProtectedFileUrl(fileId) {
  const [state, setState] = useState({ fileId: null, url: null, type: null, error: false });

  useEffect(() => {
    if (!fileId) return undefined;
    let url = null;
    let cancelled = false;
    fetchBlob(`/files/${encodeURIComponent(fileId)}`)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ fileId, url, type: blob.type, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ fileId, url: null, type: null, error: true });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileId]);

  const current = state.fileId === fileId ? state : { url: null, type: null, error: false };
  return { ...current, loading: Boolean(fileId) && !current.url && !current.error };
}

/**
 * `<img>` for a protected file id. Shows a spinner while loading and a placeholder when it fails or when there
 * is no file id (`fallback` replaces that placeholder, e.g. initials).
 */
export const ProtectedImage = ({ fileId, alt = '', className = '', fallback = null, onClick }) => {
  const { url, error, loading } = useProtectedFileUrl(fileId);

  if (!fileId || error) {
    return (
      fallback ?? (
        <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
          <ImageOff className="w-5 h-5" />
        </div>
      )
    );
  }
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={`object-cover ${className}`} onClick={onClick} />;
};

export default ProtectedImage;
