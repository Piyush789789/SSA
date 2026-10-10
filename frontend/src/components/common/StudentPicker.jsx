import React, { useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { http, withQuery } from '@/api/http';

/**
 * Search box that finds students by name, roll number or ID (GET /students?q=) and lets the user pick one.
 * `value` is the chosen student object (or null); `onChange(student|null)`.
 */
export const StudentPicker = ({ value, onChange, placeholder = 'Search student by name or ID…', autoFocus = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ query: '', list: [], error: '' });

  const trimmed = query.trim();
  useEffect(() => {
    if (trimmed.length < 2) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      http
        .get(withQuery('/students', { q: trimmed }))
        .then((list) => {
          if (!cancelled) setResults({ query: trimmed, list: (list ?? []).slice(0, 12), error: '' });
        })
        .catch((err) => {
          if (!cancelled) setResults({ query: trimmed, list: [], error: err.message });
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-[#FFF5F0] px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{value.name}</p>
          <p className="text-[11px] text-slate-500">
            {value.id} · Class {value.className}
            {value.rollNumber != null ? ` · Roll ${value.rollNumber}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          aria-label="Choose another student"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const searching = trimmed.length >= 2 && results.query !== trimmed;
  const shown = trimmed.length >= 2 && results.query === trimmed ? results : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-xs font-semibold focus:border-[#FF6B2C] focus:bg-white focus:outline-none"
        />
        {searching && <Loader2 className="w-4 h-4 animate-spin text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />}
      </div>
      {shown?.error && <p className="text-xs font-semibold text-red-600">{shown.error}</p>}
      {shown && !shown.error && shown.list.length === 0 && (
        <p className="text-xs text-slate-500 px-1">No student matches “{trimmed}”.</p>
      )}
      {shown && shown.list.length > 0 && (
        <ul className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
          {shown.list.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(s);
                  setQuery('');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer"
              >
                <span className="block text-xs font-bold text-slate-800">{s.name}</span>
                <span className="block text-[11px] text-slate-500">
                  {s.id} · Class {s.className}
                  {s.rollNumber != null ? ` · Roll ${s.rollNumber}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentPicker;
