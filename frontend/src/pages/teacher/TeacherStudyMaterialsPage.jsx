import React, { useState, useMemo } from 'react';
import { Library, Plus, Trash2, FileText, Search, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { formatDate } from '@/utils';
import { useI18n } from '@/i18n/translate';

const formatBytes = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export const TeacherStudyMaterialsPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const materials = useApi('/study-materials');
  const meta = useApi('/meta');
  const categories = meta.data?.materialCategories ?? [];

  const assignedClasses = useMemo(() => currentUser?.assignedClasses ?? [], [currentUser]);
  const teacherSubjects = useMemo(() => currentUser?.subjects ?? [], [currentUser]);

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const blankForm = () => ({
    title: '',
    className: assignedClasses[0] ?? '',
    subject: teacherSubjects[0] ?? '',
    category: '',
    fileType: '',
    fileSize: '',
  });
  const [uploadForm, setUploadForm] = useState(blankForm);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredMaterials = useMemo(() => {
    return (materials.data ?? []).filter((mat) => {
      if (!assignedClasses.includes(mat.className)) return false;
      if (selectedClassFilter !== 'ALL' && mat.className !== selectedClassFilter) return false;
      if (activeCategory !== 'ALL' && mat.category !== activeCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (mat.title ?? '').toLowerCase().includes(q);
        const subjMatch = (mat.subject ?? '').toLowerCase().includes(q);
        if (!titleMatch && !subjMatch) return false;
      }
      return true;
    });
  }, [materials.data, assignedClasses, selectedClassFilter, activeCategory, searchQuery]);

  const openUploadModal = () => {
    setUploadForm({ ...blankForm(), category: categories[0] ?? '' });
    setFormError('');
    setIsUploadModalOpen(true);
  };

  const handleFilePicked = (file) => {
    if (!file) {
      setUploadForm((prev) => ({ ...prev, fileType: '', fileSize: '' }));
      return;
    }
    const extension = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : '';
    setUploadForm((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^.]+$/, ''),
      fileType: extension,
      fileSize: formatBytes(file.size),
    }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim() || !uploadForm.category) {
      setFormError('Please enter a title and choose a category.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await http.post('/study-materials', {
        title: uploadForm.title.trim(),
        subject: uploadForm.subject,
        className: uploadForm.className,
        category: uploadForm.category,
        fileType: uploadForm.fileType || undefined,
        fileSize: uploadForm.fileSize || undefined,
      });
      setIsUploadModalOpen(false);
      triggerToast('Study material added.');
      materials.reload();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study material?')) return;
    setActionError('');
    try {
      await http.delete(`/study-materials/${encodeURIComponent(id)}`);
      triggerToast('Study material deleted.');
      materials.reload();
    } catch (error) {
      setActionError(error.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Library className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>{tx('Study Materials')}</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Upload and share class notes, worksheets, and reference guides
          </p>
        </div>

        <button
          onClick={openUploadModal}
          disabled={meta.loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Category Tabs & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          {['ALL', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-white text-[#FF6B2C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Materials' : cat}
            </button>
          ))}
        </div>

        {/* Search & Class Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF6B2C]"
            />
          </div>

          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Classes</option>
            {assignedClasses.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">{actionError}</div>
      )}

      {/* Study Materials Grid */}
      <AsyncState state={materials} loadingText="Loading study materials…">
      {() => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
            No study materials for this selection yet.
          </div>
        ) : (
          filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-orange-200 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-orange-100 text-[#FF6B2C] font-bold rounded-lg text-xs">
                    Class {mat.className}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[11px]">
                    {mat.category}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#FF6B2C] flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2">{mat.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {mat.subject} • {mat.teacherId === currentUser?.id ? 'You' : mat.teacherName}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Added: {formatDate(mat.uploadedDate)}</span>
                  <span>{[mat.fileType, mat.fileSize].filter(Boolean).join(' • ') || 'No file details'}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span
                  className="flex-1 h-9 bg-slate-50 border border-slate-200 text-slate-400 font-semibold rounded-xl text-[11px] flex items-center justify-center"
                  title="File storage is not available yet"
                >
                  Download not available yet
                </span>

                {mat.teacherId === currentUser?.id && (
                <button
                  onClick={() => handleDelete(mat.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 stroke-[2]" />
                </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      )}
      </AsyncState>

      {/* Upload Material Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Study Material</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Material Title</label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g. Chapter 5 Practice Worksheet"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class</label>
                  <select
                    value={uploadForm.className}
                    onChange={(e) => setUploadForm({ ...uploadForm, className: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                  >
                    {assignedClasses.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                  >
                    {teacherSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">File (optional)</label>
                  <input
                    type="file"
                    onChange={(e) => handleFilePicked(e.target.files?.[0])}
                    className="w-full text-[11px] text-slate-600 file:mr-2 file:px-2 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-xs file:font-bold"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                File storage is not available yet: only the title, category and file details
                {uploadForm.fileType ? ` (${uploadForm.fileType}, ${uploadForm.fileSize})` : ''} are saved, not the file itself.
              </p>

              {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  {tx('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="disabled:opacity-50 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer"
                >
                  {saving ? tx('Saving…') : tx('Add Material')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudyMaterialsPage;
