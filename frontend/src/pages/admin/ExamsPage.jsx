import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Plus,
  CheckCircle2,
  Award,
  Search,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
  Printer,
  AlertCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate } from '@/utils';

import { CreateExamModal } from '@/components/exams/CreateExamModal';
import { MarksEntryTable } from '@/components/exams/MarksEntryTable';
import { ReportCardPreviewModal } from '@/components/exams/ReportCardPreviewModal';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';
import { useI18n } from '@/i18n/translate';

const NONE = [];
const TABS = ['Overview', 'Exams', 'Marks Entry', 'Results', 'Report Cards'];
const TAB_ALIASES = { marksEntry: 'Marks Entry', results: 'Results', exams: 'Exams' };

const statusBadge = (status) =>
  status === 'Completed'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : status === 'Upcoming'
    ? 'bg-orange-50 text-[#FF6B2C] border border-orange-200'
    : status === 'Ongoing'
    ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-slate-100 text-slate-600 border border-slate-200';

const pct = (value) => (value == null ? '—' : `${value}%`);

export const ExamsPage = () => {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSidebarId, setActiveSidebarId] = useState('exams');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const requested = location.state?.activeTab;
    return TAB_ALIASES[requested] || (TABS.includes(requested) ? requested : 'Overview');
  });

  // Server data
  const examsApi = useApi('/exams');
  const metaApi = useApi('/meta');
  const classesApi = useApi('/classes');
  const exams = examsApi.data || NONE;
  const meta = metaApi.data;
  const classIds = useMemo(() => (classesApi.data || NONE).map((c) => c.id), [classesApi.data]);
  const gradeBands = meta?.gradeBands || NONE;

  // Workflow filters
  const [selectedExamId, setSelectedExamId] = useState(location.state?.selectedExam || '');
  const [chosenClass, setChosenClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [examModal, setExamModal] = useState({ isOpen: false, exam: null });
  const [examToDelete, setExamToDelete] = useState(null);
  const [reportStudentId, setReportStudentId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Falls back to the first exam when the selected one no longer exists (e.g. after deleting it).
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0] || null;
  const examClasses = currentExam?.classes || NONE;
  const selectedClass = examClasses.includes(chosenClass) ? chosenClass : examClasses[0] || '';

  const needsResults = (activeTab === 'Results' || activeTab === 'Report Cards') && currentExam && selectedClass;
  const resultsApi = useApi(
    needsResults ? withQuery(`/results/exams/${currentExam.id}`, { className: selectedClass }) : null,
  );
  const rosterApi = useApi(activeTab === 'Report Cards' && selectedClass ? `/classes/${selectedClass}/students` : null);

  const overviewStats = useMemo(
    () => ({
      upcoming: exams.filter((e) => e.status === 'Upcoming').length,
      ongoing: exams.filter((e) => e.status === 'Ongoing').length,
      completed: exams.filter((e) => e.status === 'Completed').length,
      publishedResults: exams.filter((e) => e.resultsStatus === 'Published').length,
      total: exams.length,
    }),
    [exams],
  );

  const gpaFor = (grade) => gradeBands.find((b) => b.grade === grade)?.gpa;

  const classResultMetrics = useMemo(() => {
    const rows = resultsApi.data || NONE;
    if (rows.length === 0) {
      return { appeared: 0, passed: 0, failed: 0, passPercentage: '—', classAverage: '—', highest: null, lowest: null, rows };
    }
    const passed = rows.filter((r) => r.passedAll).length;
    const average = rows.reduce((sum, r) => sum + (r.percentage || 0), 0) / rows.length;
    return {
      appeared: rows.length,
      passed,
      failed: rows.length - passed,
      passPercentage: `${((passed / rows.length) * 100).toFixed(1)}%`,
      classAverage: `${average.toFixed(1)}%`,
      highest: rows[0],
      lowest: rows[rows.length - 1],
      rows,
    };
  }, [resultsApi.data]);

  const reportCardRows = useMemo(() => {
    const roster = rosterApi.data || NONE;
    const byStudent = new Map((resultsApi.data || NONE).map((r) => [r.studentId, r]));
    const q = searchQuery.toLowerCase().trim();
    return roster
      .filter((s) => !q || s.name.toLowerCase().includes(q) || String(s.rollNumber).includes(q) || s.id.toLowerCase().includes(q))
      .map((s) => ({ ...s, result: byStudent.get(s.id) || null }));
  }, [rosterApi.data, resultsApi.data, searchQuery]);

  const handleExamSaved = (saved) => {
    examsApi.reload();
    if (saved?.id) setSelectedExamId(saved.id);
    triggerToast(examModal.exam ? 'Examination updated.' : 'New examination created.');
  };

  const handleDeleteExam = async () => {
    await http.delete(`/exams/${examToDelete.id}`);
    setExamToDelete(null);
    if (selectedExamId === examToDelete.id) setSelectedExamId('');
    examsApi.reload();
    triggerToast('Examination deleted.');
  };

  const handleTogglePublish = async () => {
    if (!currentExam) return;
    const publish = currentExam.resultsStatus !== 'Published';
    setPublishing(true);
    setActionError('');
    try {
      await http.post(`/exams/${currentExam.id}/${publish ? 'publish' : 'unpublish'}`);
      await examsApi.reload();
      triggerToast(publish ? 'Results published to students and parents.' : 'Results unpublished.');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const classSelect = (
    <select
      value={selectedClass}
      onChange={(e) => setChosenClass(e.target.value)}
      className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
    >
      {examClasses.map((c) => (
        <option key={c} value={c}>Class {c}</option>
      ))}
    </select>
  );

  const examSelect = (
    <select
      value={currentExam?.id || ''}
      onChange={(e) => setSelectedExamId(e.target.value)}
      className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
    >
      {exams.map((ex) => (
        <option key={ex.id} value={ex.id}>{ex.name}</option>
      ))}
    </select>
  );

  const noExams = <EmptyMessage text="No examinations yet. Use “Create Exam” to add one." />;

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#FF6B2C] border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
                <FileCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {tx('Exams & Results Management')}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                  Manage examinations, schedule tests, enter marks, and generate report cards
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExamModal({ isOpen: true, exam: null })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{tx('Create Exam')}</span>
            </button>
          </div>

          {/* Main Navigation Tabs */}
          <div className="border-b border-slate-200 overflow-x-auto custom-scrollbar">
            <nav className="flex space-x-6 min-w-max" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-xs font-bold capitalize transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-[#FF6B2C] text-[#FF6B2C]'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tx(tab)}
                </button>
              ))}
            </nav>
          </div>

          <AsyncState state={examsApi} loadingText="Loading examinations…">
            {() => (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'Overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Upcoming Exams</p>
                        <h3 className="text-xl font-black text-slate-900 mt-1">{overviewStats.upcoming}</h3>
                      </div>
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                        <p className="text-[10px] font-bold text-amber-700 uppercase">Ongoing Exams</p>
                        <h3 className="text-xl font-black text-amber-700 mt-1">{overviewStats.ongoing}</h3>
                      </div>
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">Completed Exams</p>
                        <h3 className="text-xl font-black text-emerald-700 mt-1">{overviewStats.completed}</h3>
                      </div>
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                        <p className="text-[10px] font-bold text-indigo-700 uppercase">Published Results</p>
                        <h3 className="text-xl font-black text-indigo-700 mt-1">{overviewStats.publishedResults}</h3>
                      </div>
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                        <p className="text-[10px] font-bold text-[#FF6B2C] uppercase">Total Exams</p>
                        <h3 className="text-xl font-black text-[#FF6B2C] mt-1">{overviewStats.total}</h3>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">All Examinations</h3>
                        <span className="text-xs text-slate-400">{exams.length} exams</span>
                      </div>

                      {exams.length === 0 ? (
                        noExams
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                <th className="py-2.5 px-3">Exam Name</th>
                                <th className="py-2.5 px-3">Type</th>
                                <th className="py-2.5 px-3">Date Range</th>
                                <th className="py-2.5 px-3">Classes</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Results</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold">
                              {exams.map((ex) => (
                                <tr key={ex.id} className="hover:bg-slate-50">
                                  <td className="py-3 px-3 font-bold text-slate-900">{ex.name}</td>
                                  <td className="py-3 px-3 text-slate-600">{ex.type}</td>
                                  <td className="py-3 px-3 text-slate-500 font-normal">
                                    {formatDate(ex.startDate)} – {formatDate(ex.endDate)}
                                  </td>
                                  <td className="py-3 px-3 text-slate-700">
                                    {ex.classes.slice(0, 3).join(', ') + (ex.classes.length > 3 ? '…' : '')}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadge(ex.status)}`}>
                                      {ex.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">{ex.resultsStatus}</td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        title="View exam"
                                        onClick={() => navigate(`/admin/exams/${ex.id}`)}
                                        className="p-1.5 text-slate-400 hover:text-[#FF6B2C] rounded-lg hover:bg-orange-50 transition-colors"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Edit exam"
                                        onClick={() => setExamModal({ isOpen: true, exam: ex })}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Delete exam"
                                        onClick={() => setExamToDelete(ex)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. EXAMS TAB */}
                {activeTab === 'Exams' &&
                  (exams.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">{noExams}</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {exams.map((ex) => (
                        <div key={ex.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-orange-50 text-[#FF6B2C] font-extrabold text-xs border border-orange-100">
                              {ex.type}
                            </span>
                            <span className="text-xs font-bold text-slate-400">{ex.academicYear}</span>
                          </div>

                          <div>
                            <h3 className="font-extrabold text-slate-900 text-base">{ex.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(ex.startDate)} – {formatDate(ex.endDate)}
                            </p>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-semibold space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Status:</span>
                              <span className="text-slate-900 font-bold">{ex.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Results:</span>
                              <span className="text-slate-900 font-bold">{ex.resultsStatus}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400 shrink-0">Classes:</span>
                              <span className="text-slate-900 font-bold text-right">{ex.classes.join(', ')}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/exams/${ex.id}`)}
                              className="font-bold text-[#FF6B2C] hover:underline inline-flex items-center gap-1"
                            >
                              View Schedule <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExamId(ex.id);
                                setActiveTab('Marks Entry');
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
                            >
                              Enter Marks
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                {/* 3. MARKS ENTRY TAB */}
                {activeTab === 'Marks Entry' && (
                  <MarksEntryTable
                    exams={exams}
                    selectedExamId={currentExam?.id}
                    onExamChange={setSelectedExamId}
                    gradeBands={gradeBands}
                    onSaved={triggerToast}
                  />
                )}

                {/* 4. RESULTS TAB */}
                {activeTab === 'Results' &&
                  (!currentExam ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">{noExams}</div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Select Exam</label>
                            {examSelect}
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Filter Class</label>
                            {classSelect}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            disabled={publishing}
                            onClick={handleTogglePublish}
                            className={`px-4 py-2.5 text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer transition-colors disabled:opacity-60 ${
                              currentExam.resultsStatus === 'Published'
                                ? 'bg-slate-700 hover:bg-slate-800'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {publishing
                              ? 'Please wait…'
                              : currentExam.resultsStatus === 'Published'
                              ? 'Unpublish Results'
                              : 'Publish Exam Results'}
                          </button>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Results are {currentExam.resultsStatus === 'Published' ? 'visible' : 'not yet visible'} to students &amp; parents
                          </span>
                          {actionError && <span className="text-[11px] font-semibold text-rose-600">{actionError}</span>}
                        </div>
                      </div>

                      <AsyncState state={resultsApi} loadingText="Loading class results…">
                        {() => (
                          <>
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                  <h3 className="font-extrabold text-slate-900 text-base">
                                    Class Overall Performance Summary — Class {selectedClass}
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {currentExam.name} • {currentExam.academicYear}
                                  </p>
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-full border border-blue-100">
                                  {classResultMetrics.appeared} Students with marks
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Appeared</p>
                                  <h4 className="text-xl font-black text-slate-900 mt-0.5">{classResultMetrics.appeared}</h4>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Passed All</p>
                                  <h4 className="text-xl font-black text-emerald-800 mt-0.5">{classResultMetrics.passed}</h4>
                                </div>
                                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                                  <p className="text-[10px] font-bold text-rose-800 uppercase">Failed Any</p>
                                  <h4 className="text-xl font-black text-rose-800 mt-0.5">{classResultMetrics.failed}</h4>
                                </div>
                                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                                  <p className="text-[10px] font-bold text-emerald-900 uppercase">Pass Rate</p>
                                  <h4 className="text-xl font-black text-emerald-700 mt-0.5">{classResultMetrics.passPercentage}</h4>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                  <p className="text-[10px] font-bold text-indigo-800 uppercase">Class Average</p>
                                  <h4 className="text-xl font-black text-indigo-800 mt-0.5">{classResultMetrics.classAverage}</h4>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                                  <p className="text-[10px] font-bold text-amber-900 uppercase">Highest Score</p>
                                  <h4 className="text-xl font-black text-amber-800 mt-0.5">{pct(classResultMetrics.highest?.percentage)}</h4>
                                  <p className="text-[9px] font-bold text-amber-700 truncate mt-0.5">
                                    {classResultMetrics.highest?.studentName || '—'}
                                  </p>
                                </div>
                                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200">
                                  <p className="text-[10px] font-bold text-rose-900 uppercase">Lowest Score</p>
                                  <h4 className="text-xl font-black text-rose-700 mt-0.5">{pct(classResultMetrics.lowest?.percentage)}</h4>
                                  <p className="text-[9px] font-bold text-rose-700 truncate mt-0.5">
                                    {classResultMetrics.lowest?.studentName || '—'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {classResultMetrics.rows.length === 0 ? (
                              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                                <EmptyMessage text={`No marks have been entered for Class ${selectedClass} in this exam yet.`} />
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <div className="bg-white rounded-3xl border border-amber-200/80 p-5 sm:p-6 shadow-xs space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Award className="w-5 h-5 text-amber-500" />
                                      <h3 className="font-extrabold text-slate-900 text-base">Top Performers (Highest Marks)</h3>
                                    </div>
                                    <div className="space-y-2 text-xs font-bold">
                                      {classResultMetrics.rows.slice(0, 3).map((st) => (
                                        <div key={st.studentId} className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
                                          <div className="flex items-center gap-2.5">
                                            <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-[11px]">
                                              {st.rank}
                                            </span>
                                            <div>
                                              <p className="text-slate-900 font-extrabold">{st.studentName}</p>
                                              <p className="text-[10px] text-slate-400 font-semibold">
                                                Roll No: {st.rollNumber} • Class {selectedClass}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-amber-900 font-black text-sm">{pct(st.percentage)}</span>
                                            <span className="block text-[10px] font-bold text-amber-700">Grade: {st.grade}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="bg-white rounded-3xl border border-rose-200/80 p-5 sm:p-6 shadow-xs space-y-3">
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className="w-5 h-5 text-rose-500" />
                                      <h3 className="font-extrabold text-slate-900 text-base">Lowest Performers (Needs Attention)</h3>
                                    </div>
                                    <div className="space-y-2 text-xs font-bold">
                                      {[...classResultMetrics.rows].reverse().slice(0, 3).map((st, idx) => (
                                        <div key={st.studentId} className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                                          <div className="flex items-center gap-2.5">
                                            <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-[11px]">
                                              {idx + 1}
                                            </span>
                                            <div>
                                              <p className="text-slate-900 font-extrabold">{st.studentName}</p>
                                              <p className="text-[10px] text-slate-400 font-semibold">
                                                Roll No: {st.rollNumber} • Class {selectedClass}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-rose-900 font-black text-sm">{pct(st.percentage)}</span>
                                            <span className="block text-[10px] font-bold text-rose-700">
                                              Result: {st.passedAll ? 'Pass' : 'Fail'}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <h3 className="font-extrabold text-slate-900 text-base">Student Result Master List</h3>
                                    <span className="text-xs font-semibold text-slate-400">{classResultMetrics.rows.length} Students</span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                          <th className="py-2.5 px-3">Rank</th>
                                          <th className="py-2.5 px-3">Student Name</th>
                                          <th className="py-2.5 px-3">Roll No</th>
                                          <th className="py-2.5 px-3 text-center">Total Marks</th>
                                          <th className="py-2.5 px-3 text-center">Percentage</th>
                                          <th className="py-2.5 px-3 text-center">Grade / GPA</th>
                                          <th className="py-2.5 px-3 text-center">Result</th>
                                          <th className="py-2.5 px-3 text-right">Report Card</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-semibold">
                                        {classResultMetrics.rows.map((s) => (
                                          <tr key={s.studentId} className="hover:bg-slate-50">
                                            <td className="py-3 px-3 text-slate-600">{s.rank}</td>
                                            <td className="py-3 px-3 font-bold text-slate-900">{s.studentName}</td>
                                            <td className="py-3 px-3 text-slate-600">{s.rollNumber}</td>
                                            <td className="py-3 px-3 text-center font-bold text-slate-900">
                                              {s.totalObtained} / {s.totalMaxMarks}
                                            </td>
                                            <td className="py-3 px-3 text-center font-black text-[#FF6B2C]">{pct(s.percentage)}</td>
                                            <td className="py-3 px-3 text-center font-bold">
                                              {s.grade}
                                              {gpaFor(s.grade) != null ? ` (GPA: ${gpaFor(s.grade)})` : ''}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                              <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                  s.passedAll
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}
                                              >
                                                {s.passedAll ? 'PASS' : 'FAIL'}
                                              </span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                              <button
                                                type="button"
                                                onClick={() => setReportStudentId(s.studentId)}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6B2C] hover:underline cursor-pointer"
                                              >
                                                Preview Report <ChevronRight className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </AsyncState>
                    </div>
                  ))}

                {/* 5. REPORT CARDS TAB */}
                {activeTab === 'Report Cards' &&
                  (!currentExam ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">{noExams}</div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search student for report card..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {examSelect}
                          {classSelect}
                        </div>
                      </div>

                      <AsyncState state={[rosterApi, resultsApi]} loadingText="Loading students…">
                        {() =>
                          reportCardRows.length === 0 ? (
                            <EmptyMessage text="No students found." />
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                    <th className="py-2.5 px-3">Student Name</th>
                                    <th className="py-2.5 px-3">Roll No</th>
                                    <th className="py-2.5 px-3">Class</th>
                                    <th className="py-2.5 px-3">Student ID</th>
                                    <th className="py-2.5 px-3 text-center">Overall %</th>
                                    <th className="py-2.5 px-3 text-center">Grade</th>
                                    <th className="py-2.5 px-3 text-right">Report Card Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-semibold">
                                  {reportCardRows.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50">
                                      <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                                      <td className="py-3 px-3 text-slate-600">{s.rollNumber}</td>
                                      <td className="py-3 px-3 text-slate-600">{s.className}</td>
                                      <td className="py-3 px-3 text-slate-400 font-medium">{s.id}</td>
                                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                                        {s.result ? pct(s.result.percentage) : '—'}
                                      </td>
                                      <td className="py-3 px-3 text-center font-black text-slate-900">
                                        {s.result?.grade || '—'}
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => setReportStudentId(s.id)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#FF6B2C] hover:bg-[#FF6B2C] hover:text-white rounded-xl text-xs font-bold transition-colors"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                          <span>View / Print Report</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                        }
                      </AsyncState>
                    </div>
                  ))}
              </>
            )}
          </AsyncState>
        </main>
      </div>

      <CreateExamModal
        isOpen={examModal.isOpen}
        examToEdit={examModal.exam}
        onClose={() => setExamModal({ isOpen: false, exam: null })}
        onSaved={handleExamSaved}
        classes={classIds}
        examTypes={meta?.examTypes || NONE}
        academicYear={meta?.academicYear || ''}
      />

      <ConfirmDialog
        isOpen={Boolean(examToDelete)}
        title="Delete Examination?"
        message="This removes the exam, its papers and all marks entered for it. This cannot be undone."
        detail={examToDelete ? `${examToDelete.name} (${formatDate(examToDelete.startDate)} – ${formatDate(examToDelete.endDate)})` : null}
        confirmLabel="Delete"
        onClose={() => setExamToDelete(null)}
        onConfirm={handleDeleteExam}
      />

      <ReportCardPreviewModal
        isOpen={Boolean(reportStudentId)}
        onClose={() => setReportStudentId(null)}
        studentId={reportStudentId}
        exam={currentExam}
      />
    </div>
  );
};

export default ExamsPage;
