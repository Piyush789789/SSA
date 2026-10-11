import React, { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload, CheckCircle2, X } from 'lucide-react';
import { http } from '@/api/http';
import { saveBlob } from '@/api/files';
import { useI18n } from '@/i18n/translate';
import { fmtMark } from './questionMarks';
import { buildTemplateRows, mapSheetToImportRows, mergeImportResult, parseCsv, templateFileName } from './marksImport';

const ROW_STYLES = {
  OK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SAVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ERROR: 'bg-rose-50 text-rose-700 border-rose-200',
};

/** Reads an .xlsx or .csv File into rows of cells (the first sheet of a workbook). */
const readSpreadsheet = async (file) => {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv') || file.type === 'text/csv') return parseCsv(await file.text());
  if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    return readSheet(file);
  }
  return null;
};

/**
 * Excel / CSV upload of a marks sheet: download a template with the class roster, upload a filled .xlsx/.csv,
 * check it with a dry run (POST /exam-schedules/{id}/marks/import, dryRun: true), then save the valid rows as
 * Draft marks. `onSheetReloaded(freshSheet)` receives the reloaded marks sheet after a real import.
 */
export const MarksImportPanel = ({ sheet, locked = false, onSheetReloaded }) => {
  const { t } = useI18n();
  const fileInput = useRef(null);
  const schedule = sheet?.schedule;
  const scheduleId = schedule?.id;

  const [fileName, setFileName] = useState('');
  const [pending, setPending] = useState(null); // { rows, localErrors } waiting for "Save"
  const [result, setResult] = useState(null); // merged dry-run or import result
  const [busy, setBusy] = useState(null); // 'template' | 'check' | 'save'
  const [error, setError] = useState('');

  const formatLocal = (e) => t(e.key, e.vars);

  const reset = () => {
    setPending(null);
    setResult(null);
    setFileName('');
    setError('');
  };

  const downloadTemplate = async () => {
    setBusy('template');
    setError('');
    try {
      const { default: writeExcelFile } = await import('write-excel-file/browser');
      const [header, ...body] = buildTemplateRows(sheet);
      const data = [header.map((value) => ({ value, fontWeight: 'bold', backgroundColor: '#F1F5F9' })), ...body];
      const columns = header.map((h, i) => ({ width: i === 0 ? 18 : i === 2 ? 26 : Math.max(8, String(h).length + 2) }));
      const blob = await writeExcelFile(data, { columns, stickyRowsCount: 1, sheet: 'Marks' }).toBlob();
      saveBlob(blob, templateFileName(schedule));
    } catch (err) {
      setError(err.message || t('marks.templateFailed'));
    } finally {
      setBusy(null);
    }
  };

  const chooseFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    reset();
    setFileName(file.name);
    setBusy('check');
    try {
      let cells;
      try {
        cells = await readSpreadsheet(file);
      } catch {
        throw new Error(t('marks.importUnreadable'));
      }
      if (cells == null) throw new Error(t('marks.importWrongType'));
      const mapped = mapSheetToImportRows(cells, schedule?.questions ?? []);
      if (mapped.error) throw new Error(t(mapped.error.key, mapped.error.vars));
      if (mapped.rows.length === 0 && mapped.localErrors.length === 0) throw new Error(t('marks.importEmpty'));

      const check =
        mapped.rows.length > 0
          ? await http.post(`/exam-schedules/${encodeURIComponent(scheduleId)}/marks/import`, { dryRun: true, rows: mapped.rows })
          : { dryRun: true, total: 0, valid: 0, saved: 0, failed: 0, rows: [] };
      setPending(mapped);
      setResult(mergeImportResult(check, mapped.localErrors, formatLocal));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const saveImport = async () => {
    setBusy('save');
    setError('');
    try {
      const saved = await http.post(`/exam-schedules/${encodeURIComponent(scheduleId)}/marks/import`, {
        dryRun: false,
        rows: pending.rows,
      });
      setResult(mergeImportResult(saved, pending.localErrors, formatLocal));
      setPending(null);
      const fresh = await http.get(`/exam-schedules/${encodeURIComponent(scheduleId)}/marks`);
      onSheetReloaded?.(fresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const isDryRun = result?.dryRun !== false;
  const validCount = result?.valid ?? 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4" aria-label={t('marks.uploadTitle')}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{t('marks.uploadTitle')}</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {(schedule?.questions?.length ?? 0) > 0 ? t('marks.uploadHintQ') : t('marks.uploadHint')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={busy != null || !sheet}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50"
          >
            {busy === 'template' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {t('marks.downloadTemplate')}
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy != null || locked || !sheet}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === 'check' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {busy === 'check' ? t('marks.checking') : t('marks.uploadButton')}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={chooseFile}
            className="hidden"
            data-testid="marks-file-input"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600" role="alert">
          {fileName ? `${fileName}: ` : ''}
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3">
          {!isDryRun && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
              <span>{t('marks.importSaved', { n: result.saved })}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            {fileName && <span className="text-slate-500 mr-1">{fileName}</span>}
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{t('marks.countRows', { n: result.total })}</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              {isDryRun ? t('marks.countValid', { n: result.valid }) : t('marks.countSaved', { n: result.saved })}
            </span>
            <span className={`px-2 py-0.5 rounded-md ${result.failed > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
              {t('marks.countErrors', { n: result.failed })}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-3">{t('marks.colRow')}</th>
                  <th className="py-2 px-3">{t('marks.student')}</th>
                  <th className="py-2 px-3">{t('marks.status')}</th>
                  <th className="py-2 px-3">{t('marks.colMessage')}</th>
                  <th className="py-2 px-3 text-right">{t('marks.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.rows.map((r, i) => (
                  <tr key={`${r.row}-${i}`}>
                    <td className="py-2 px-3 font-bold text-slate-600">{r.row}</td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-slate-900">{r.studentName || '—'}</span>
                      {r.studentId && <span className="block text-[10px] text-slate-400">{r.studentId}</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${ROW_STYLES[r.status] ?? ROW_STYLES.ERROR}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{r.message || ''}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{r.total == null ? '—' : fmtMark(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={busy === 'save'}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              {isDryRun ? t('marks.cancel') : t('marks.close')}
            </button>
            {isDryRun && pending && (
              <button
                type="button"
                onClick={saveImport}
                disabled={busy != null || validCount === 0 || locked}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-xl text-xs shadow-md shadow-[#FF6B2C]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy === 'save' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {busy === 'save' ? t('marks.saving') : t('marks.saveStudents', { n: validCount })}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default MarksImportPanel;
