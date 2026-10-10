import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, DatabaseBackup, HardDrive, Info, Loader2 } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { formatDateTime } from '@/utils';

const formatSize = (bytes) => {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const RESTORE_COMMAND = 'pg_restore -U postgres -d school_erp --clean <file>';

/** /admin/backups — database backup status, list of backup files, manual backup and restore steps. */
export const BackupsPage = () => {
  const backups = useApi('/admin/backups');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const backUpNow = async () => {
    setRunning(true);
    setError('');
    setCreated(null);
    try {
      const file = await http.post('/admin/backups');
      setCreated(file);
      backups.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const enabled = backups.data?.enabled;

  return (
    <AdminPageShell
      activeItemId="backups"
      title="Backups"
      description="Copies of the school database, taken every night at 02:30 (the newest 14 are kept)."
      actions={
        enabled ? (
          <button
            type="button"
            onClick={backUpNow}
            disabled={running}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 self-start disabled:opacity-60 cursor-pointer"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseBackup className="w-4 h-4" />}
            {running ? 'Backing up…' : 'Back up now'}
          </button>
        ) : null
      }
    >
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {created && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Backup created: {created.name} ({formatSize(created.sizeBytes)})
        </p>
      )}

      <AsyncState state={backups} loadingText="Loading backups…">
        {(data) =>
          !data.enabled ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <HardDrive className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Backups are not available on this server</h2>
              <p className="text-sm text-slate-500 max-w-lg">
                Automatic and manual backups use PostgreSQL&apos;s <span className="font-mono">pg_dump</span>. This
                server is not running on PostgreSQL (for example, it is using the built-in demo database), so there is
                nothing to back up here. Switch the backend to PostgreSQL to enable nightly backups.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <p className="text-lg font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" /> Enabled
                  </p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest backup</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">
                    {data.files?.length ? formatDateTime(data.files[0].createdAt) : 'None yet'}
                  </p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Folder on server</p>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1 break-all">{data.directory || '—'}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Backup files</h2>
                </div>
                {(data.files || []).length === 0 ? (
                  <EmptyMessage text="No backups yet. Use “Back up now” or wait for the nightly backup." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 sm:px-6">File</th>
                          <th className="py-3 px-4">Created</th>
                          <th className="py-3 px-4 sm:px-6 text-right">Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {data.files.map((file) => (
                          <tr key={file.name} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 sm:px-6 font-mono font-semibold text-slate-800 break-all">{file.name}</td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDateTime(file.createdAt)}</td>
                            <td className="py-3 px-4 sm:px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatSize(file.sizeBytes)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#FF6B2C]" /> How to restore a backup
                </h2>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
                  <li>Stop the school ERP backend so nobody changes data during the restore.</li>
                  <li>
                    On the server, open a terminal in the backup folder
                    {data.directory ? (
                      <>
                        {' '}(<span className="font-mono">{data.directory}</span>)
                      </>
                    ) : null}
                    .
                  </li>
                  <li>
                    Run the command below, replacing <span className="font-mono">&lt;file&gt;</span> with the backup
                    file name. It replaces the current data with the backup.
                  </li>
                  <li>Start the backend again.</li>
                </ol>
                <pre className="rounded-xl bg-slate-900 text-emerald-300 text-xs font-mono p-4 overflow-x-auto">
                  {RESTORE_COMMAND}
                </pre>
              </div>
            </>
          )
        }
      </AsyncState>
    </AdminPageShell>
  );
};

export default BackupsPage;
