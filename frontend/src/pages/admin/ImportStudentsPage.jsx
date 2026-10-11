import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { EmptyMessage } from '@/components/common/AsyncState';
import { downloadFile, postSlow, saveBlob } from '@/api/files';
import { todayIso } from '@/utils';

const COLUMNS =
  'student id (your admission no., optional), name, class (5-B, or class 5 + a separate section column), roll, gender, date of birth, blood group, email, address (+ city, state, PIN), admission date, guardian name, guardian relation, guardian phone, guardian email';

const ROW_STYLES = {
  OK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CREATED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ERROR: 'bg-rose-50 text-rose-700 border-rose-200',
};

const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** /admin/import-students — admit many students at once from a CSV file (check first, then import). */
export const ImportStudentsPage = () => {
  const [file, setFile] = useState(null);
  const [csv, setCsv] = useState('');
  const [createLogins, setCreateLogins] = useState(true);
  const [check, setCheck] = useState(null); // dry-run result
  const [imported, setImported] = useState(null); // real import result
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const downloadTemplate = async () => {
    setBusy('template');
    setError('');
    try {
      await downloadFile('/import/students/template', 'students-template.csv');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const chooseFile = async (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (!chosen) return;
    setError('');
    setCheck(null);
    setImported(null);
    try {
      setFile(chosen);
      setCsv(await chosen.text());
    } catch {
      setError('Could not read that file.');
    }
  };

  const run = async (dryRun) => {
    setBusy(dryRun ? 'check' : 'import');
    setError('');
    try {
      // Each new login gets a securely hashed password (~0.1-0.3 s each), so a whole school can take minutes.
      const result = await postSlow('/import/students', { csv, dryRun, createLogins }, dryRun ? 180000 : 900000);
      if (dryRun) setCheck(result);
      else {
        setImported(result);
        setCheck(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const downloadLogins = () => {
    const lines = [['Name', 'Login', 'Temporary password'], ...imported.logins.map((l) => [l.name, l.loginId, l.temporaryPassword])];
    const text = lines.map((row) => row.map(csvCell).join(',')).join('\r\n');
    saveBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), `student-logins-${todayIso()}.csv`);
  };

  const startOver = () => {
    setFile(null);
    setCsv('');
    setCheck(null);
    setImported(null);
    setError('');
  };

  return (
    <AdminPageShell
      activeItemId="import-students"
      title="Import Students"
      description="Admit many students at once from a spreadsheet saved as CSV. Parents are matched by email or phone, or created."
    >
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {imported ? (
        <ImportDone result={imported} onDownloadLogins={downloadLogins} onStartOver={startOver} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Step number={1} title="Download the template">
              <p className="text-xs text-slate-500">
                Columns: {COLUMNS}. Only <strong>name</strong> and <strong>class</strong> are required.
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                disabled={busy === 'template'}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#FF6B2C] hover:text-[#FF6B2C] disabled:opacity-60 cursor-pointer"
              >
                {busy === 'template' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Template (CSV)
              </button>
            </Step>
            <Step number={2} title="Choose your CSV file">
              <p className="text-xs text-slate-500">Fill the template in Excel or Google Sheets and save / download it as CSV.</p>
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#FF6B2C] hover:text-[#FF6B2C] cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" />
                {file ? 'Choose another file' : 'Choose file'}
                <input type="file" accept=".csv,text/csv" onChange={chooseFile} className="hidden" />
              </label>
              {file && <p className="text-xs font-semibold text-slate-700 break-all">{file.name}</p>}
            </Step>
            <Step number={3} title="Check, then import">
              <p className="text-xs text-slate-500">Checking saves nothing: every row is validated first.</p>
              <button
                type="button"
                onClick={() => run(true)}
                disabled={!csv || busy != null}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-4 py-2 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-50 cursor-pointer"
              >
                {busy === 'check' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Check file
              </button>
            </Step>
          </div>

          {check && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Check result</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {check.valid} of {check.total} rows are ready to import
                    {check.failed ? `, ${check.failed} ${check.failed === 1 ? 'has' : 'have'} errors and will be skipped` : ''}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createLogins}
                      onChange={(e) => setCreateLogins(e.target.checked)}
                      className="accent-[#FF6B2C]"
                    />
                    Create logins (students & new parents)
                  </label>
                  <button
                    type="button"
                    onClick={() => run(false)}
                    disabled={check.valid === 0 || busy != null}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B2C] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#F25A1B] disabled:opacity-50 cursor-pointer"
                  >
                    {busy === 'import' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import {check.valid} {check.valid === 1 ? 'student' : 'students'}
                  </button>
                </div>
              </div>
              {busy === 'import' && (
                <p className="px-6 py-3 text-xs font-semibold text-amber-700 bg-amber-50 border-y border-amber-100">
                  Importing… {createLogins ? 'Creating logins takes about a minute for every 200–300 students. ' : ''}
                  Please keep this page open.
                </p>
              )}
              <RowsTable rows={check.rows} />
            </div>
          )}
        </>
      )}
    </AdminPageShell>
  );
};

const Step = ({ number, title, children }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3">
    <div className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-full bg-[#FFF5F0] text-[#FF6B2C] text-xs font-black flex items-center justify-center">{number}</span>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
    </div>
    {children}
  </div>
);

const RowsTable = ({ rows, onlyErrors = false }) => {
  const shown = (rows ?? []).filter((r) => !onlyErrors || r.status === 'ERROR');
  if (shown.length === 0) return <EmptyMessage text={onlyErrors ? 'No errors.' : 'The file has no rows.'} />;
  const sorted = [...shown].sort((a, b) => (a.status === 'ERROR' ? 0 : 1) - (b.status === 'ERROR' ? 0 : 1) || a.row - b.row);
  return (
    <div className="overflow-x-auto max-h-[480px] custom-scrollbar">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="sticky top-0">
          <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4 sm:px-6 w-16">Row</th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 sm:px-6">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((r) => (
            <tr key={r.row} className={r.status === 'ERROR' ? 'bg-rose-50/30' : ''}>
              <td className="py-2.5 px-4 sm:px-6 font-mono text-slate-500">{r.row}</td>
              <td className="py-2.5 px-4 font-semibold text-slate-900">
                {r.name || '—'}
                {r.id ? <span className="ml-2 font-mono text-[11px] text-slate-400">{r.id}</span> : null}
              </td>
              <td className="py-2.5 px-4">
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${ROW_STYLES[r.status] ?? ''}`}>{r.status}</span>
              </td>
              <td className="py-2.5 px-4 sm:px-6 text-slate-600">{r.message || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ImportDone = ({ result, onDownloadLogins, onStartOver }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-3xl border border-emerald-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {result.created} {result.created === 1 ? 'student' : 'students'} admitted
          </h2>
          <p className="text-xs text-slate-500">
            {result.failed
              ? `${result.failed} ${result.failed === 1 ? 'row was' : 'rows were'} skipped because of errors.`
              : 'Every row was imported.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStartOver}
        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#FF6B2C] cursor-pointer"
      >
        Import another file
      </button>
    </div>

    {result.logins?.length > 0 && (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">New logins ({result.logins.length})</h2>
            <button
              type="button"
              onClick={onDownloadLogins}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download as CSV
            </button>
          </div>
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />
            These temporary passwords are shown only once. Download or copy them now and hand them out privately —
            everyone must choose their own password at first sign-in.
          </p>
        </div>
        <div className="overflow-x-auto max-h-[480px] custom-scrollbar">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="sticky top-0">
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Name</th>
                <th className="py-3 px-4">Login</th>
                <th className="py-3 px-4 sm:px-6">Temporary password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.logins.map((l) => (
                <tr key={l.loginId}>
                  <td className="py-2.5 px-4 sm:px-6 font-semibold text-slate-900">{l.name}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">{l.loginId}</td>
                  <td className="py-2.5 px-4 sm:px-6 font-mono font-bold tracking-wider text-slate-900">{l.temporaryPassword}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {result.failed > 0 && (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Skipped rows</h2>
        </div>
        <RowsTable rows={result.rows} onlyErrors />
      </div>
    )}
  </div>
);

export default ImportStudentsPage;
