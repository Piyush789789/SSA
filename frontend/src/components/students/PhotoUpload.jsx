import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadFile } from '@/api/files';
import { ProtectedImage } from '@/components/common/ProtectedImage';
import { initialsOf } from '@/utils';
import { useI18n } from '@/i18n/translate';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp';

/** Uploads a passport photo (POST /files) and reports the new file id via `onChange(id)`. */
export const PhotoUpload = ({ fileId, name, onChange, onUploaded, size = 'w-20 h-24', compact = false }) => {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError(t('photo.onlyImages'));
    if (file.size > MAX_BYTES) return setError(t('photo.tooLarge'));
    setBusy(true);
    setError('');
    try {
      const uploaded = await uploadFile(file);
      onChange?.(uploaded.id);
      await onUploaded?.(uploaded.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const placeholder = (
    <div className={`${size} rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-lg font-bold`}>
      {initialsOf(name) || <Camera className="w-5 h-5" />}
    </div>
  );

  return (
    <div className={`flex ${compact ? 'flex-col items-center gap-1.5' : 'items-center gap-4'}`}>
      {fileId ? <ProtectedImage fileId={fileId} alt={name} className={`${size} rounded-xl border border-slate-200`} fallback={placeholder} /> : placeholder}
      <div className={compact ? 'text-center' : ''}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:border-[#FF6B2C] hover:text-[#FF6B2C] disabled:opacity-60 cursor-pointer"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {busy ? t('photo.uploading') : fileId ? t('photo.change') : t('photo.upload')}
        </button>
        {error && <p className="mt-1 text-[11px] font-semibold text-rose-600 max-w-[200px]">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={pick} />
    </div>
  );
};

export default PhotoUpload;
