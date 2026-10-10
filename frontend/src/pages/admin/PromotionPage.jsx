import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  GraduationCap,
  Loader2,
  Search,
  UserMinus,
  X,
} from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/AdminPageShell';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';

const YEAR_PATTERN = /^\d{4}-\d{2}$/;

/** "2026-27" -> "2027-28" */
const nextYear = (year) => {
  if (!YEAR_PATTERN.test(year || '')) return '';
  const start = Number(year.slice(0, 4)) + 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
};

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-[#FF6B2C] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/15';

const Stat = ({ label, value, className }) => (
  <div className={`rounded-2xl border p-4 ${className}`}>
    <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
    <p className="text-2xl font-extrabold mt-1">{value}</p>
  </div>
);

const PromotionSummary = ({ result }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Stat label="Promoted" value={result.promoted} className="bg-emerald-50 border-emerald-200 text-emerald-800" />
      <Stat label="Graduated" value={result.graduated} className="bg-indigo-50 border-indigo-200 text-indigo-800" />
      <Stat label="Detained" value={result.detained} className="bg-amber-50 border-amber-200 text-amber-800" />
    </div>
    {(result.moves || []).length === 0 ? (
      <EmptyMessage text="No students to move." />
    ) : (
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">From class</th>
              <th className="py-3 px-4" />
              <th className="py-3 px-4">To class</th>
              <th className="py-3 px-4 text-right">Students</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.moves.map((move) => (
              <tr key={`${move.fromClass}-${move.toClass}`}>
                <td className="py-3 px-4 font-bold text-slate-800">Class {move.fromClass}</td>
                <td className="py-3 px-4 text-slate-400">
                  <ArrowRight className="w-4 h-4" />
                </td>
                <td className="py-3 px-4 font-bold">
                  {move.toClass === 'Graduated' ? (
                    <span className="inline-flex items-center gap-1.5 text-indigo-700">
                      <GraduationCap className="w-4 h-4" /> Graduated
                    </span>
                  ) : (
                    <span className="text-slate-800">Class {move.toClass}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-slate-900">{move.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const PromotionWizard = ({ settings, students }) => {
  const fromYear = settings.currentAcademicYear;
  const [toYear, setToYear] = useState(() => nextYear(fromYear));
  const [detained, setDetained] = useState([]); // student objects
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(''); // 'preview' | 'run'
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const phrase = `PROMOTE ${toYear}`;
  const detainedIds = useMemo(() => new Set(detained.map((s) => s.id)), [detained]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter(
        (s) =>
          !detainedIds.has(s.id) &&
          (s.name?.toLowerCase().includes(q) ||
            s.id?.toLowerCase().includes(q) ||
            s.className?.toLowerCase() === q),
      )
      .slice(0, 12);
  }, [students, query, detainedIds]);

  const invalidate = () => {
    setPreview(null);
    setConfirmText('');
    setError('');
  };

  const addDetained = (student) => {
    setDetained((list) => [...list, student]);
    setQuery('');
    invalidate();
  };

  const removeDetained = (id) => {
    setDetained((list) => list.filter((s) => s.id !== id));
    invalidate();
  };

  const send = async (dryRun) => {
    if (!YEAR_PATTERN.test(toYear)) return setError('The new academic year must look like 2027-28.');
    setBusy(dryRun ? 'preview' : 'run');
    setError('');
    try {
      const result = await http.post('/admin/promotion', {
        toAcademicYear: toYear,
        detainedStudentIds: detained.map((s) => s.id),
        dryRun,
      });
      if (dryRun) setPreview(result);
      else setDone(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Promotion complete</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The school moved from {done.fromAcademicYear} to {done.toAcademicYear}. Roll numbers were renumbered
              alphabetically in every class.
            </p>
          </div>
        </div>
        <PromotionSummary result={done} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold">This moves every active student up one class and cannot be undone.</p>
          <p>
            Class 10 students graduate; everyone else moves to the next grade in the same section. Detained students
            stay in their class. Roll numbers are renumbered alphabetically and the school&apos;s academic year changes
            to the new session. Take a backup first.
          </p>
        </div>
      </div>

      {/* Step 1 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Session and detained students</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600">Current academic year</span>
            <p className="h-10 flex items-center px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700">
              {fromYear || '—'}
            </p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-600">New academic year</span>
            <input
              value={toYear}
              onChange={(e) => {
                setToYear(e.target.value.trim());
                invalidate();
              }}
              placeholder="2027-28"
              className={inputClass}
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-600">
            Detained students <span className="font-medium text-slate-400">(they repeat their current class)</span>
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, student ID or class (e.g. 5-B)"
              className={`${inputClass} pl-9`}
            />
            {matches.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                {matches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => addDetained(s)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      <span>
                        <span className="font-bold text-slate-800">{s.name}</span>
                        <span className="text-slate-400"> · {s.id}</span>
                      </span>
                      <span className="font-semibold text-slate-500">Class {s.className}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && matches.length === 0 && (
              <p className="mt-1 text-[11px] text-slate-400">No matching active students.</p>
            )}
          </div>
          {detained.length === 0 ? (
            <p className="text-xs text-slate-400">No one is detained — every active student will move up.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {detained.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  {s.name} (Class {s.className})
                  <button
                    type="button"
                    onClick={() => removeDetained(s.id)}
                    className="p-0.5 rounded-full hover:bg-amber-100 cursor-pointer"
                    aria-label={`Remove ${s.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => send(true)}
          disabled={busy !== ''}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-2xl disabled:opacity-60 cursor-pointer"
        >
          {busy === 'preview' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          Preview promotion
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {/* Step 2 */}
      {preview && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Preview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nothing has changed yet. {preview.fromAcademicYear} → {preview.toAcademicYear}.
            </p>
          </div>
          <PromotionSummary result={preview} />

          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Confirm</h2>
            <label className="block space-y-1.5 max-w-md">
              <span className="text-xs font-semibold text-slate-600">
                Type <span className="font-mono font-bold text-rose-600">{phrase}</span> to confirm
              </span>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={inputClass}
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              onClick={() => send(false)}
              disabled={busy !== '' || confirmText.trim() !== phrase}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy === 'run' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
              Run promotion now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/** /admin/promotion — end-of-year promotion: preview (dry run), choose detained students, then confirm. */
export const PromotionPage = () => {
  const settings = useApi('/settings');
  const students = useApi('/students');

  return (
    <AdminPageShell
      activeItemId="promotion"
      title="Year-end Promotion"
      description="Move every class up one grade at the end of the academic year."
    >
      <AsyncState state={[settings, students]} loadingText="Loading students…">
        {([s, list]) => <PromotionWizard settings={s} students={list || []} />}
      </AsyncState>
    </AdminPageShell>
  );
};

export default PromotionPage;
