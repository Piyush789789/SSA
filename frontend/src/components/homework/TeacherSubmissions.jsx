import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Inbox, Loader2, RotateCcw, X } from 'lucide-react';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { ProtectedFileThumb, SubmissionChip } from './Submissions';
import { formatDate, formatDateTime } from '@/utils';

/**
 * "Submissions (n/total)" button for one homework row. It loads the class's checking sheet and opens it in a
 * dialog where the teacher reviews each submission.
 */
export const SubmissionsButton = ({ homework }) => {
  const sheet = useApi(`/homework/${encodeURIComponent(homework.id)}/submissions`);
  const [open, setOpen] = useState(false);
  const rows = sheet.data ?? [];
  const submitted = rows.filter((r) => r.submission).length;
  const toCheck = rows.filter((r) => r.submission?.status === 'SUBMITTED').length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap cursor-pointer ${
          toCheck > 0
            ? 'border-[#FF6B2C] bg-[#FFF5F0] text-[#FF6B2C]'
            : 'border-slate-200 text-slate-600 hover:border-[#FF6B2C] hover:text-[#FF6B2C]'
        }`}
        title={toCheck > 0 ? `${toCheck} waiting to be checked` : 'Submissions'}
      >
        <Inbox className="w-3.5 h-3.5" />
        {sheet.loading ? '…' : sheet.error ? 'Submissions' : `Submissions (${submitted}/${rows.length})`}
      </button>
      {open && <SubmissionsDialog homework={homework} sheet={sheet} onClose={() => setOpen(false)} />}
    </>
  );
};

const SubmissionsDialog = ({ homework, sheet, onClose }) => {
  const [filter, setFilter] = useState('ALL');
  const filters = [
    { id: 'ALL', label: 'All' },
    { id: 'SUBMITTED', label: 'To check' },
    { id: 'REVIEWED', label: 'Checked' },
    { id: 'REDO', label: 'Redo' },
    { id: 'MISSING', label: 'Not submitted' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900 truncate">Submissions — {homework.title}</h3>
            <p className="text-xs text-slate-500">
              Class {homework.className} · {homework.subject} · Due {formatDate(homework.dueDate)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 px-5 pt-4">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                filter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto p-5">
          <AsyncState state={sheet} loadingText="Loading submissions…">
            {(rows) => {
              const shown = (rows ?? []).filter((r) =>
                filter === 'ALL' ? true : filter === 'MISSING' ? !r.submission : r.submission?.status === filter,
              );
              if (shown.length === 0) return <EmptyMessage text="Nobody here." />;
              return (
                <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {shown.map((row) => (
                    <SubmissionRow key={row.studentId} row={row} onReviewed={sheet.reload} />
                  ))}
                </ul>
              );
            }}
          </AsyncState>
        </div>
      </div>
    </div>
  );
};

const SubmissionRow = ({ row, onReviewed }) => {
  const s = row.submission;
  const [grade, setGrade] = useState(s?.grade ?? '');
  const [feedback, setFeedback] = useState(s?.feedback ?? '');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const review = async (status) => {
    setBusy(status);
    setError('');
    try {
      await http.post(`/homework-submissions/${encodeURIComponent(s.id)}/review`, {
        status,
        grade: grade.trim() || null,
        feedback: feedback.trim() || null,
      });
      onReviewed();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">
            <span className="text-slate-400 font-semibold mr-1.5">#{row.rollNumber ?? '—'}</span>
            {row.studentName}
          </p>
          {s && (
            <p className="text-[11px] text-slate-400">
              Submitted {formatDateTime(s.submittedAt)}
              {s.late ? ' · late' : ''}
              {s.reviewedBy ? ` · checked by ${s.reviewedBy}` : ''}
            </p>
          )}
        </div>
        {s ? (
          <SubmissionChip submission={s} />
        ) : (
          <span className="px-2.5 py-0.5 border rounded-lg text-xs font-bold bg-slate-50 text-slate-500 border-slate-200">Not submitted</span>
        )}
      </div>

      {s && (
        <>
          {s.text && <p className="text-xs text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl p-2.5">{s.text}</p>}
          {s.fileIds?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {s.fileIds.map((id) => (
                <ProtectedFileThumb key={id} fileId={id} />
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={grade}
              maxLength={10}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Grade (e.g. A)"
              className="h-9 sm:w-28 rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
            />
            <input
              value={feedback}
              maxLength={2000}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Feedback for the student (optional)"
              className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:border-[#FF6B2C] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy != null}
              onClick={() => review('REVIEWED')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              {busy === 'REVIEWED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Mark checked
            </button>
            <button
              type="button"
              disabled={busy != null}
              onClick={() => review('REDO')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 cursor-pointer"
            >
              {busy === 'REDO' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Ask to redo
            </button>
          </div>
          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </>
      )}
    </li>
  );
};

export default SubmissionsButton;
