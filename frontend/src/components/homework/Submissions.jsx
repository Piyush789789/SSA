import React, { useEffect, useState } from 'react';
import { AlertCircle, FileText, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { fetchBlob, uploadFile } from '@/api/files';
import { formatDateTime } from '@/utils';
import { useI18n } from '@/i18n/translate';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf';

/**
 * Thumbnail of an uploaded file (GET /files/{id} with the auth header, shown through an object URL).
 * Images show a preview; other files (PDF) show an icon. Clicking opens the file in a new tab.
 */
export const ProtectedFileThumb = ({ fileId, size = 'md' }) => {
  const [state, setState] = useState({ url: null, type: null, error: false });

  useEffect(() => {
    let url = null;
    let cancelled = false;
    fetchBlob(`/files/${encodeURIComponent(fileId)}`)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ url, type: blob.type, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ url: null, type: null, error: true });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileId]);

  const box = size === 'sm' ? 'w-14 h-14' : 'w-24 h-24';
  const isImage = state.type?.startsWith('image/') && !state.type.includes('heic') && !state.type.includes('heif');

  if (state.error) {
    return (
      <div className={`${box} rounded-xl border border-red-200 bg-red-50 text-[10px] font-semibold text-red-600 flex items-center justify-center text-center p-1`}>
        Can't load
      </div>
    );
  }
  if (!state.url) {
    return (
      <div className={`${box} rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center`}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }
  return (
    <a
      href={state.url}
      target="_blank"
      rel="noreferrer"
      className={`${box} rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center hover:border-[#FF6B2C] shrink-0`}
      title="Open file"
    >
      {isImage ? (
        <img src={state.url} alt="Submitted work" className="w-full h-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500">
          <FileText className="w-6 h-6 text-slate-400" />
          {state.type === 'application/pdf' ? 'PDF' : 'File'}
        </span>
      )}
    </a>
  );
};

/** "Submitted / Checked (grade) / Redo" chip for a homework card. */
export const SubmissionChip = ({ submission }) => {
  if (!submission) return null;
  const styles = {
    SUBMITTED: 'bg-sky-50 text-sky-700 border-sky-200',
    REVIEWED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REDO: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const label =
    submission.status === 'REVIEWED'
      ? `Checked${submission.grade ? ` (${submission.grade})` : ''}`
      : submission.status === 'REDO'
        ? 'Redo'
        : `Submitted${submission.late ? ' late' : ''}`;
  return (
    <span className={`px-2.5 py-0.5 border rounded-lg text-xs font-bold ${styles[submission.status] ?? styles.SUBMITTED}`}>{label}</span>
  );
};

/** Teacher feedback block under a homework card. */
export const SubmissionFeedback = ({ submission }) => {
  if (!submission) return null;
  return (
    <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 space-y-1.5">
      <p className="text-[11px] font-semibold text-slate-500">
        Submitted {formatDateTime(submission.submittedAt)}
        {submission.late ? ' (late)' : ''}
      </p>
      {submission.fileIds?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {submission.fileIds.map((id) => (
            <ProtectedFileThumb key={id} fileId={id} size="sm" />
          ))}
        </div>
      )}
      {submission.feedback && (
        <p className="text-xs text-slate-700">
          <strong>Teacher:</strong> {submission.feedback}
        </p>
      )}
    </div>
  );
};

/**
 * Hand in a homework: text and photos/PDFs. Each new file is uploaded (POST /files), then the submission is
 * saved (PUT /homework/{id}/submission). Parents pass `studentId`. Re-submitting replaces the previous one.
 */
export const HomeworkSubmitModal = ({ homework, studentId, existing, onClose, onSubmitted }) => {
  const { tx } = useI18n();
  const [text, setText] = useState(existing?.text ?? '');
  const [keptFileIds, setKeptFileIds] = useState(existing?.fileIds ?? []);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pickFiles = (e) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = '';
    const tooBig = chosen.filter((f) => f.size > MAX_BYTES);
    if (tooBig.length) setError(`${tooBig.map((f) => f.name).join(', ')} ${tooBig.length === 1 ? 'is' : 'are'} larger than 5 MB.`);
    else setError('');
    setFiles((prev) => [...prev, ...chosen.filter((f) => f.size <= MAX_BYTES)]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0 && keptFileIds.length === 0) {
      setError('Write an answer or add at least one photo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const uploaded = [];
      for (let i = 0; i < files.length; i += 1) {
        setProgress(`Uploading ${i + 1} of ${files.length}…`);
        const result = await uploadFile(files[i]);
        uploaded.push(result.id);
      }
      setProgress('Submitting…');
      const saved = await http.put(withQuery(`/homework/${encodeURIComponent(homework.id)}/submission`, { studentId }), {
        text: text.trim() || null,
        fileIds: [...keptFileIds, ...uploaded],
      });
      onSubmitted(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
      setProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">{tx(existing ? 'Submit again' : 'Submit homework')}</h3>
            <p className="text-xs text-slate-500">
              {homework.subject} · {homework.title}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {existing && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
              This replaces your earlier submission.
            </p>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">Answer / note (optional)</span>
            <textarea
              rows={4}
              maxLength={4000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
            />
          </label>

          <div>
            <span className="mb-1 block text-xs font-bold text-slate-700">Photos or PDF (up to 5 MB each)</span>
            <div className="flex flex-wrap gap-2">
              {keptFileIds.map((id) => (
                <div key={id} className="relative">
                  <ProtectedFileThumb fileId={id} size="sm" />
                  <button
                    type="button"
                    onClick={() => setKeptFileIds((ids) => ids.filter((x) => x !== id))}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-white border border-slate-200 p-0.5 text-slate-500 hover:text-red-600"
                    aria-label="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {files.map((f, i) => (
                <LocalFileThumb
                  key={`${f.name}-${i}`}
                  file={f}
                  onRemove={() => setFiles((list) => list.filter((_, j) => j !== i))}
                />
              ))}
              <label className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#FF6B2C] hover:text-[#FF6B2C] flex items-center justify-center cursor-pointer">
                <ImagePlus className="w-5 h-5" />
                <input type="file" accept={ACCEPT} multiple onChange={pickFiles} className="hidden" />
              </label>
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="mt-px h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-5">
          {progress && <span className="mr-auto text-xs font-semibold text-slate-500">{progress}</span>}
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
            {tx('Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {tx('Submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

/** Preview of a file chosen on this device (not uploaded yet). */
const LocalFileThumb = ({ file, onRemove }) => {
  const [url, setUrl] = useState(null);
  const isImage = file.type.startsWith('image/') && !/hei[cf]/i.test(file.type);

  useEffect(() => {
    if (!isImage) return undefined;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

  return (
    <div className="relative" title={file.name}>
      <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
        {url ? (
          <img src={url} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <span className="flex flex-col items-center text-[9px] font-bold text-slate-500 px-1 text-center break-all">
            <FileText className="w-5 h-5 text-slate-400" />
            {file.name.split('.').pop()?.toUpperCase()}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 rounded-full bg-white border border-slate-200 p-0.5 text-slate-500 hover:text-red-600"
        aria-label="Remove file"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
