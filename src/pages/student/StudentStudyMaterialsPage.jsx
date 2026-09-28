import React, { useState, useMemo } from 'react';
import { Library, Download, Eye, FileText, Search, CheckCircle2, BookOpen, FileCode, Sparkles, Filter, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const StudentStudyMaterialsPage = () => {
  const { currentUser } = useAuth();
  const { studyMaterials } = useData();

  const className = currentUser?.className || '5-B';

  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const defaultMaterials = [
    {
      id: 'MAT-501',
      title: 'Fractions & Decimals Comprehensive Chapter Notes',
      subject: 'Mathematics',
      className: '5-B',
      category: 'Notes',
      uploadedDate: '2026-03-24',
      fileType: 'PDF',
      fileSize: '3.4 MB',
      teacher: 'Anjali Singh',
      description: 'Step-by-step visual guides to adding, subtracting, and comparing like and unlike fractions with real-life examples.',
    },
    {
      id: 'MAT-502',
      title: 'Class 5 Math Practice Worksheet - Multiplication & Division',
      subject: 'Mathematics',
      className: '5-B',
      category: 'Worksheet',
      uploadedDate: '2026-03-22',
      fileType: 'PDF',
      fileSize: '1.8 MB',
      teacher: 'Anjali Singh',
      description: '25 practice numericals and 5 word problems for weekly revision test practice.',
    },
    {
      id: 'MAT-503',
      title: 'Plant Life Cycle & Photosynthesis Illustrated Diagrams',
      subject: 'Science',
      className: '5-B',
      category: 'Notes',
      uploadedDate: '2026-03-20',
      fileType: 'PDF',
      fileSize: '4.2 MB',
      teacher: 'Vikram Mehta',
      description: 'High-definition diagrams of leaf structures, stomata, and sunlight absorption mechanisms.',
    },
    {
      id: 'MAT-504',
      title: 'Science Experiment Lab Sheet - States of Matter',
      subject: 'Science',
      className: '5-B',
      category: 'Worksheet',
      uploadedDate: '2026-03-18',
      fileType: 'DOCX',
      fileSize: '850 KB',
      teacher: 'Vikram Mehta',
      description: 'Record observations on melting, evaporation, condensation, and freezing experiments.',
    },
    {
      id: 'MAT-505',
      title: 'English Grammar Rules: Tenses & Active/Passive Voice',
      subject: 'English',
      className: '5-B',
      category: 'Revision',
      uploadedDate: '2026-03-15',
      fileType: 'PDF',
      fileSize: '2.1 MB',
      teacher: 'Priya Sharma',
      description: 'Quick reference cheat-sheet for past, present, and future perfect tenses with sentence transformation exercises.',
    },
    {
      id: 'MAT-506',
      title: 'Our Heritage & Ancient Civilizations Summary Booklet',
      subject: 'Social Science',
      className: '5-B',
      category: 'Notes',
      uploadedDate: '2026-03-12',
      fileType: 'PDF',
      fileSize: '5.1 MB',
      teacher: 'Rajesh Kumar',
      description: 'Maps, timelines, and key facts about the Indus Valley Civilization and ancient trading routes.',
    },
  ];

  // Combine erp study materials with defaults
  const allMaterials = useMemo(() => {
    const fromContext = (studyMaterials || []).filter((m) => m.className === className);
    const map = new Map();
    [...defaultMaterials, ...fromContext].forEach((item) => {
      map.set(item.id || item.title, item);
    });
    return Array.from(map.values());
  }, [studyMaterials, className]);

  // Filtering
  const filteredList = useMemo(() => {
    return allMaterials.filter((mat) => {
      if (selectedSubject !== 'ALL' && mat.subject !== selectedSubject) return false;
      if (selectedCategory !== 'ALL' && mat.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = mat.title.toLowerCase().includes(q);
        const subjMatch = mat.subject.toLowerCase().includes(q);
        const descMatch = mat.description?.toLowerCase().includes(q);
        if (!titleMatch && !subjMatch && !descMatch) return false;
      }
      return true;
    });
  }, [allMaterials, selectedSubject, selectedCategory, searchQuery]);

  const handleDownload = (mat) => {
    triggerToast(`Downloading "${mat.title}" (${mat.fileSize})...`);
  };

  const subjects = ['ALL', 'Mathematics', 'Science', 'English', 'Social Science'];
  const categories = ['ALL', 'Notes', 'Worksheet', 'Revision'];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Library className="w-7 h-7 text-[#FF6B2C]" />
            Study Materials & Notes
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Access downloadable worksheets, chapter notes, and revision papers for Class {className}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-orange-50 border border-[#FF6B2C]/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#EA580C]">
            {filteredList.length} Files Available
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by topic, title, or keyword..."
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
          {/* Subject Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Subject:</span>
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-[#FF6B2C] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-5 w-px bg-slate-200" />

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Study Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((mat) => (
          <div
            key={mat.id}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#FF6B2C]/40 transition-all p-5 sm:p-6 flex flex-col justify-between group"
          >
            <div>
              {/* Card Top Meta */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-[#EA580C] border border-orange-100">
                  {mat.subject}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {mat.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#FF6B2C] transition-colors leading-snug mb-2">
                {mat.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                {mat.description || 'Supplementary study notes and practice materials curated by your teacher.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>By {mat.teacher || 'Class Teacher'}</span>
                <span>{mat.fileSize} • {mat.fileType}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMaterial(mat)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  Preview
                </button>
                <button
                  onClick={() => handleDownload(mat)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs font-bold transition-all shadow-xs shadow-[#FF6B2C]/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
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
                  <p className="text-xs text-slate-500">{previewMaterial.subject} • {previewMaterial.category}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-800 mb-2">Document Summary & Notes:</p>
              <p>{previewMaterial.description}</p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                <div>Uploaded on: <strong>{previewMaterial.uploadedDate}</strong></div>
                <div>Instructor: <strong>{previewMaterial.teacher || 'Class Teacher'}</strong></div>
                <div>File Format: <strong>{previewMaterial.fileType} ({previewMaterial.fileSize})</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(previewMaterial);
                  setPreviewMaterial(null);
                }}
                className="px-5 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentStudyMaterialsPage;
