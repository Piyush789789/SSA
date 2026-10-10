import React, { useState, useMemo } from 'react';
import { Library, Download, Eye, FileText, Search, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate } from '@/utils';
import { useI18n } from '@/i18n/translate';

export const StudentStudyMaterialsPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const className = currentUser?.className;

  const materials = useApi(className ? withQuery('/study-materials', { className }) : null);
  const meta = useApi('/meta');

  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState(null);

  const subjects = useMemo(
    () => ['ALL', ...[...new Set((materials.data || []).map((m) => m.subject))].sort()],
    [materials.data],
  );
  const categories = useMemo(() => {
    const fromMeta = meta.data?.materialCategories;
    const fromData = [...new Set((materials.data || []).map((m) => m.category))];
    return ['ALL', ...(fromMeta?.length ? fromMeta : fromData.sort())];
  }, [meta.data, materials.data]);

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (materials.data || []).filter((mat) => {
      if (selectedSubject !== 'ALL' && mat.subject !== selectedSubject) return false;
      if (selectedCategory !== 'ALL' && mat.category !== selectedCategory) return false;
      if (q && ![mat.title, mat.subject, mat.teacherName].some((v) => v && v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [materials.data, selectedSubject, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Library className="w-7 h-7 text-[#FF6B2C]" />
            {tx('Study Materials & Notes')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Notes, worksheets and revision material shared by your teachers{className ? ` for Class ${className}` : ''}.
          </p>
        </div>

        <div className="bg-orange-50 border border-[#FF6B2C]/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#EA580C] self-start sm:self-auto">
          {filteredList.length} Files Listed
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject or teacher..."
            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Subject:</span>
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubject === subj ? 'bg-[#FF6B2C] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {subj === 'ALL' ? 'All' : subj}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-5 w-px bg-slate-200" />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AsyncState state={materials} loadingText="Loading study materials…">
        {(list) =>
          filteredList.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <EmptyMessage text={list.length === 0 ? 'No study materials have been shared yet.' : 'No materials match your filters.'} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredList.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#FF6B2C]/40 transition-all p-5 sm:p-6 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-[#EA580C] border border-orange-100">
                        {mat.subject}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {mat.category}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#FF6B2C] transition-colors leading-snug mb-2">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Uploaded {formatDate(mat.uploadedDate)}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium gap-2">
                      <span className="truncate">By {mat.teacherName || '—'}</span>
                      <span className="shrink-0">{[mat.fileSize, mat.fileType].filter(Boolean).join(' • ')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewMaterial(mat)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Details
                      </button>
                      <button
                        disabled
                        title="File downloads are not available yet — ask your teacher for a copy."
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download soon
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </AsyncState>

      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{previewMaterial.title}</h3>
                  <p className="text-xs text-slate-500">
                    {previewMaterial.subject} • {previewMaterial.category}
                  </p>
                </div>
              </div>
              <button onClick={() => setPreviewMaterial(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1.5">
              <div>
                Uploaded on: <strong>{formatDate(previewMaterial.uploadedDate)}</strong>
              </div>
              <div>
                Teacher: <strong>{previewMaterial.teacherName || '—'}</strong>
              </div>
              <div>
                Class: <strong>{previewMaterial.className}</strong>
              </div>
              <div>
                File: <strong>{[previewMaterial.fileType, previewMaterial.fileSize].filter(Boolean).join(' • ') || '—'}</strong>
              </div>
              <p className="pt-2 text-[11px] text-slate-500">
                The school system stores only the details of this material; the file itself cannot be downloaded here yet.
              </p>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {tx('Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentStudyMaterialsPage;
