import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Images,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { http } from '@/api/http';
import { uploadFile } from '@/api/files';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { ProtectedImage, useProtectedFileUrl } from '@/components/common/ProtectedImage';
import {
  FormError,
  FormField,
  Modal,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textAreaClass,
} from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';
import { useI18n } from '@/i18n/translate';
import { formatDate, todayIso } from '@/utils';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
const isImageFile = (file) => (file.type ? file.type.startsWith('image/') : /\.(heic|heif)$/i.test(file.name));
const sizeLabel = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`);

let nextKey = 0;

/**
 * Dialog that uploads several photos one by one (with per-file status) and then either creates an album
 * (`album` null) or adds the photos to `album`.
 */
const PhotoUploadDialog = ({ album, onClose, onSaved }) => {
  const { t, tx } = useI18n();
  const isNew = !album;
  const [form, setForm] = useState({ title: '', eventDate: todayIso(), description: '' });
  const [items, setItems] = useState([]); // {key, file, status:'waiting'|'uploading'|'done'|'error', id, error}
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const pickFiles = (e) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = '';
    const rejected = [];
    const accepted = [];
    chosen.forEach((file) => {
      if (!isImageFile(file)) rejected.push(`${file.name}: ${t('gallery.notImage')}`);
      else if (file.size > MAX_BYTES) rejected.push(`${file.name}: ${t('gallery.tooBig')}`);
      else accepted.push({ key: ++nextKey, file, status: 'waiting', id: null, error: '' });
    });
    setError(rejected.join(' · '));
    setItems((prev) => [...prev, ...accepted]);
  };

  const removeItem = (key) => setItems((prev) => prev.filter((item) => item.key !== key));
  const patchItem = (key, patch) => setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const submit = async () => {
    setError('');
    if (isNew && !form.title.trim()) return setError('Please enter the album title.');
    if (isNew && !form.eventDate) return setError('Please choose the event date.');
    if (!isNew && items.length === 0) return setError('Please choose at least one photo.');

    setBusy(true);
    const ids = [];
    let failed = 0;
    for (const item of items) {
      if (item.status === 'done') {
        ids.push(item.id);
        continue;
      }
      patchItem(item.key, { status: 'uploading', error: '' });
      try {
        const uploaded = await uploadFile(item.file);
        patchItem(item.key, { status: 'done', id: uploaded.id });
        ids.push(uploaded.id);
      } catch (err) {
        failed += 1;
        patchItem(item.key, { status: 'error', error: err.message });
      }
    }
    if (failed > 0) {
      setError(`${failed} photo(s) could not be uploaded. Remove them or press the button again to retry.`);
      setBusy(false);
      return;
    }
    try {
      if (isNew) {
        await http.post('/events/albums', {
          title: form.title.trim(),
          eventDate: form.eventDate,
          description: form.description.trim() || null,
          photoIds: ids,
        });
      } else {
        await http.post(`/events/albums/${encodeURIComponent(album.id)}/photos`, { photoIds: ids });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const statusBadge = (item) => {
    if (item.status === 'uploading')
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6B2C]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('gallery.uploading')}
        </span>
      );
    if (item.status === 'done')
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" /> {t('gallery.uploaded')}
        </span>
      );
    if (item.status === 'error')
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600" title={item.error}>
          <XCircle className="w-3.5 h-3.5" /> {t('gallery.failed')}
        </span>
      );
    return <span className="text-[11px] font-semibold text-slate-400">{t('gallery.waiting')}</span>;
  };

  return (
    <Modal
      title={isNew ? t('gallery.newAlbum') : t('gallery.addPhotos')}
      subtitle={isNew ? null : album.title}
      icon={isNew ? Images : ImagePlus}
      size="lg"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonClass}>
            {tx('Cancel')}
          </button>
          <button type="button" onClick={submit} disabled={busy} className={primaryButtonClass}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {busy ? t('gallery.uploading') : isNew ? t('gallery.createAlbum') : t('gallery.uploadPhotos')}
          </button>
        </>
      }
    >
      {isNew && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label={t('gallery.albumTitle')} required className="sm:col-span-2">
              <input className={fieldClass} value={form.title} maxLength={120} onChange={set('title')} disabled={busy} />
            </FormField>
            <FormField label={t('gallery.eventDate')} required>
              <input type="date" className={fieldClass} value={form.eventDate} onChange={set('eventDate')} disabled={busy} />
            </FormField>
          </div>
          <FormField label={t('gallery.descriptionLabel')}>
            <textarea
              rows={3}
              maxLength={2000}
              className={textAreaClass}
              value={form.description}
              onChange={set('description')}
              disabled={busy}
            />
          </FormField>
        </>
      )}

      <div>
        <label
          className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center ${
            busy ? 'opacity-60' : 'cursor-pointer hover:border-[#FF6B2C] hover:bg-orange-50/40'
          }`}
        >
          <ImagePlus className="w-6 h-6 text-[#FF6B2C]" />
          <span className="text-xs font-bold text-slate-700">{t('gallery.choosePhotos')}</span>
          <span className="text-[11px] text-slate-400">{t('gallery.photoHint')}</span>
          <input type="file" accept={ACCEPT} multiple onChange={pickFiles} disabled={busy} className="hidden" />
        </label>
      </div>

      {items.length > 0 && (
        <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-100">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.file.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {sizeLabel(item.file.size)}
                  {item.error ? ` · ${item.error}` : ''}
                </p>
              </div>
              {statusBadge(item)}
              {!busy && item.status !== 'done' && (
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  aria-label="Remove"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <FormError message={error} />
    </Modal>
  );
};

/** Full-screen photo viewer with prev/next, arrow keys and Escape. */
const PhotoViewer = ({ photoIds, index, onIndexChange, onClose, title }) => {
  const count = photoIds.length;
  const { url, loading, error } = useProtectedFileUrl(photoIds[index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count);
      else if (e.key === 'ArrowRight') onIndexChange((index + 1) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, count, onIndexChange, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between gap-4 p-4 text-white">
        <p className="text-sm font-semibold truncate">
          {title} · {index + 1}/{count}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-2 rounded-xl hover:bg-white/10 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="relative flex-1 flex items-center justify-center px-4 pb-6 min-h-0" onClick={onClose}>
        {loading && <Loader2 className="w-8 h-8 animate-spin text-white/70" />}
        {error && <p className="text-sm text-white/70">Could not load this photo.</p>}
        {url && (
          <img
            src={url}
            alt={`${title} ${index + 1}`}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index - 1 + count) % count);
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index + 1) % count);
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const AlbumCard = ({ album, onOpen }) => {
  const { t } = useI18n();
  const photoIds = album.photoIds ?? [];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group text-left bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden hover:shadow-md hover:border-slate-300 transition cursor-pointer"
    >
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
        {photoIds.length > 0 ? (
          <ProtectedImage
            fileId={photoIds[0]}
            alt={album.title}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Images className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-slate-900 truncate">{album.title}</p>
        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> {formatDate(album.eventDate)}
          </span>
          <span>{t('gallery.photoCount', { n: photoIds.length })}</span>
        </div>
      </div>
    </button>
  );
};

const AlbumView = ({ album, canEdit, onBack, onChanged, onDeleted }) => {
  const { t } = useI18n();
  const [viewerIndex, setViewerIndex] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState(null); // {type:'photo', photoId} | {type:'album'}
  const photoIds = album.photoIds ?? [];

  const runConfirm = async () => {
    if (confirm.type === 'album') {
      await http.delete(`/events/albums/${encodeURIComponent(album.id)}`);
      setConfirm(null);
      onDeleted();
    } else {
      await http.delete(`/events/albums/${encodeURIComponent(album.id)}/photos/${encodeURIComponent(confirm.photoId)}`);
      setConfirm(null);
      onChanged();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={`${secondaryButtonClass} self-start`}>
          <ArrowLeft className="w-4 h-4" /> {t('gallery.backToAlbums')}
        </button>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setAdding(true)} className={primaryButtonClass}>
              <ImagePlus className="w-4 h-4" /> {t('gallery.addPhotos')}
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ type: 'album' })}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> {t('gallery.deleteAlbum')}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{album.title}</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> {formatDate(album.eventDate)} · {t('gallery.photoCount', { n: photoIds.length })}
          </p>
          {album.description && <p className="text-sm text-slate-600 mt-3 whitespace-pre-line">{album.description}</p>}
        </div>

        {photoIds.length === 0 ? (
          <EmptyMessage text={t('gallery.noPhotos')} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {photoIds.map((photoId, i) => (
              <div key={photoId} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100">
                <ProtectedImage
                  fileId={photoId}
                  alt={`${album.title} ${i + 1}`}
                  className="w-full h-full cursor-zoom-in hover:opacity-90 transition"
                  onClick={() => setViewerIndex(i)}
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: 'photo', photoId })}
                    aria-label={t('gallery.deletePhoto')}
                    title={t('gallery.deletePhoto')}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/90 text-rose-600 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition cursor-pointer hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {viewerIndex !== null && photoIds.length > 0 && (
        <PhotoViewer
          photoIds={photoIds}
          index={Math.min(viewerIndex, photoIds.length - 1)}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          title={album.title}
        />
      )}

      {adding && (
        <PhotoUploadDialog
          album={album}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            onChanged();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={confirm?.type === 'album' ? t('gallery.deleteAlbum') : t('gallery.deletePhoto')}
        message={confirm?.type === 'album' ? t('gallery.deleteAlbumMessage') : t('gallery.deletePhotoMessage')}
        detail={confirm?.type === 'album' ? `${album.title} · ${t('gallery.photoCount', { n: photoIds.length })}` : null}
        confirmLabel={confirm?.type === 'album' ? t('gallery.deleteAlbum') : t('gallery.deletePhoto')}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
};

/**
 * Events gallery: album grid → album (photo grid) → full-screen viewer.
 * With `canEdit` (admin, teacher) albums can be created and deleted and photos added or removed.
 */
export const Gallery = ({ canEdit = false }) => {
  const { t } = useI18n();
  const albums = useApi('/events/albums');
  const [openAlbumId, setOpenAlbumId] = useState(null);
  const [creating, setCreating] = useState(false);

  const sorted = useMemo(
    () => [...(albums.data ?? [])].sort((a, b) => String(b.eventDate ?? '').localeCompare(String(a.eventDate ?? ''))),
    [albums.data],
  );
  const openAlbum = openAlbumId != null ? sorted.find((a) => a.id === openAlbumId) : null;

  return (
    <div className="space-y-5">
      <AsyncState state={albums}>
        {() =>
          openAlbum ? (
            <AlbumView
              album={openAlbum}
              canEdit={canEdit}
              onBack={() => setOpenAlbumId(null)}
              onChanged={albums.reload}
              onDeleted={() => {
                setOpenAlbumId(null);
                albums.reload();
              }}
            />
          ) : (
            <>
              {canEdit && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setCreating(true)} className={primaryButtonClass}>
                    <Plus className="w-4 h-4" /> {t('gallery.newAlbum')}
                  </button>
                </div>
              )}
              {sorted.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                  <EmptyMessage text={t('gallery.noAlbums')} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {sorted.map((album) => (
                    <AlbumCard key={album.id} album={album} onOpen={() => setOpenAlbumId(album.id)} />
                  ))}
                </div>
              )}
            </>
          )
        }
      </AsyncState>

      {creating && (
        <PhotoUploadDialog
          album={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            albums.reload();
          }}
        />
      )}
    </div>
  );
};

export default Gallery;
