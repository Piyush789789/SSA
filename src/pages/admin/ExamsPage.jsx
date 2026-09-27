import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Plus,
  CheckCircle2,
  Calendar,
  Award,
  BookOpen,
  Users,
  Search,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
  Printer,
  Download,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  INITIAL_EXAMS,
  INITIAL_EXAM_SCHEDULES,
  INITIAL_MARKS_RECORDS,
  calculateGradeAndGPA,
} from '@/data/examsData';
import { CLASSES_LIST, ATTENDANCE_STUDENTS } from '@/data/attendanceData';

import { CreateExamModal } from '@/components/exams/CreateExamModal';
import { MarksEntryTable } from '@/components/exams/MarksEntryTable';
import { ReportCardPreviewModal } from '@/components/exams/ReportCardPreviewModal';

export const ExamsPage = () => {
  const navigate = useNavigate();
  const [activeSidebarId, setActiveSidebarId] = useState('exams');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  // Master Data States
  const [exams, setExams] = useState(INITIAL_EXAMS);
  const [examSchedules, setExamSchedules] = useState(INITIAL_EXAM_SCHEDULES);
  const [marksRecords, setMarksRecords] = useState(INITIAL_MARKS_RECORDS);

  // Workflow Filters State
  const [selectedExamId, setSelectedExamId] = useState(INITIAL_EXAMS[0]?.id || 'exam-001');
  const [selectedClass, setSelectedClass] = useState('10-A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Report Card State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReportStudent, setSelectedReportStudent] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Derived Overview Statistics
  const overviewStats = useMemo(() => {
    const upcoming = exams.filter((e) => e.status === 'Upcoming' || e.status === 'Scheduled').length;
    const completed = exams.filter((e) => e.status === 'Completed').length;
    const pendingMarks = marksRecords.filter((m) => m.status === 'Draft' || m.obtainedMarks === '').length || 18;
    const publishedResults = exams.filter((e) => e.resultsStatus === 'Published').length;
    const studentsAppeared = 842;

    return { upcoming, completed, pendingMarks, publishedResults, studentsAppeared };
  }, [exams, marksRecords]);

  // Create Exam Handler
  const handleCreateExam = (newExamData) => {
    const newExam = {
      id: `exam-${Date.now()}`,
      ...newExamData,
      status: 'Scheduled',
      marksCompletion: 0,
      resultsStatus: 'Pending',
    };
    setExams((prev) => [newExam, ...prev]);
    triggerToast('New Examination created successfully.');
  };

  // Delete Exam Handler
  const handleDeleteExam = (examId) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    triggerToast('Examination deleted.');
  };

  // Save/Submit Marks Handler
  const handleSaveMarks = (updatedRows, status) => {
    setMarksRecords((prev) => {
      const remaining = prev.filter(
        (m) =>
          !(
            m.examId === selectedExamId &&
            m.className === selectedClass &&
            m.subject === selectedSubject
          )
      );
      return [...remaining, ...updatedRows];
    });

    triggerToast(`Marks ${status === 'Submitted' ? 'submitted' : 'saved as draft'} successfully.`);
  };

  // Filtered Students for Results & Report Cards
  const filteredStudentsForReports = useMemo(() => {
    return ATTENDANCE_STUDENTS.filter((s) => {
      if (selectedClass !== 'ALL' && s.className !== selectedClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = s.name.toLowerCase().includes(q);
        const rollMatch = String(s.rollNumber).includes(q);
        const idMatch = s.id.toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !idMatch) return false;
      }
      return true;
    });
  }, [selectedClass, searchQuery]);

  const TABS = ['Overview', 'Exams', 'Marks Entry', 'Results', 'Report Cards'];

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Component */}
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
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
                  Exams &amp; Results Management
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                  Manage examinations, schedule tests, enter marks, and generate report cards
                </p>
              </div>
            </div>

            {/* + Create Exam Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-[#FF6B2C]/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Exam</span>
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
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content Areas */}

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Upcoming Exams</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{overviewStats.upcoming}</h3>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Completed Exams</p>
                  <h3 className="text-xl font-black text-emerald-700 mt-1">{overviewStats.completed}</h3>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Pending Marks</p>
                  <h3 className="text-xl font-black text-amber-700 mt-1">{overviewStats.pendingMarks}</h3>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-indigo-700 uppercase">Published Results</p>
                  <h3 className="text-xl font-black text-indigo-700 mt-1">{overviewStats.publishedResults}</h3>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-[#FF6B2C] uppercase">Students Appeared</p>
                  <h3 className="text-xl font-black text-[#FF6B2C] mt-1">{overviewStats.studentsAppeared}</h3>
                </div>
              </div>

              {/* Upcoming Examinations Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Upcoming &amp; Scheduled Examinations</h3>
                  <span className="text-xs text-slate-400">{exams.length} exams</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Exam Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Date Range</th>
                        <th className="py-2.5 px-3">Classes</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {exams.map((ex) => (
                        <tr key={ex.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{ex.name}</td>
                          <td className="py-3 px-3 text-slate-600">{ex.type}</td>
                          <td className="py-3 px-3 text-slate-500 font-normal">{ex.startDate} – {ex.endDate}</td>
                          <td className="py-3 px-3 text-slate-700">
                            {ex.classes ? ex.classes.slice(0, 3).join(', ') + (ex.classes.length > 3 ? '...' : '') : 'All'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              ex.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ex.status === 'Upcoming'
                                ? 'bg-orange-50 text-[#FF6B2C] border border-orange-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {ex.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/exams/${ex.id}`)}
                                className="p-1.5 text-slate-400 hover:text-[#FF6B2C] rounded-lg hover:bg-orange-50 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteExam(ex.id)}
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
              </div>
            </div>
          )}

          {/* 2. EXAMS TAB */}
          {activeTab === 'Exams' && (
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
                    <p className="text-xs text-slate-400 mt-1">{ex.startDate} – {ex.endDate}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-semibold space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Marks Completion:</span>
                      <span className="text-slate-900 font-bold">{ex.marksCompletion}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
                      <div style={{ width: `${ex.marksCompletion}%` }} className="bg-[#FF6B2C] h-full rounded-full" />
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
          )}

          {/* 3. MARKS ENTRY TAB */}
          {activeTab === 'Marks Entry' && (
            <MarksEntryTable
              exams={exams}
              classesList={CLASSES_LIST}
              selectedExamId={selectedExamId}
              selectedClass={selectedClass}
              selectedSubject={selectedSubject}
              onExamChange={setSelectedExamId}
              onClassChange={setSelectedClass}
              onSubjectChange={setSelectedSubject}
              marksData={marksRecords}
              onSaveMarks={handleSaveMarks}
            />
          )}

          {/* 4. RESULTS TAB */}
          {activeTab === 'Results' && (
            <div className="space-y-6">
              {/* Class Results Summary & Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Summary Card */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base">Class 10-A Mid-Term Results Overview</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">Pass Rate</p>
                      <h4 className="text-xl font-black text-emerald-800 mt-0.5">95.2%</h4>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-800 uppercase">Class Average</p>
                      <h4 className="text-xl font-black text-indigo-800 mt-0.5">78.4%</h4>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-800 uppercase">Highest Score</p>
                      <h4 className="text-xl font-black text-amber-800 mt-0.5">96%</h4>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-800 uppercase">Lowest Score</p>
                      <h4 className="text-xl font-black text-rose-800 mt-0.5">38%</h4>
                    </div>
                  </div>
                </div>

                {/* Top Performers Ranking List */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-amber-200/80 p-5 sm:p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-extrabold text-slate-900 text-base">Top Performing Students</h3>
                  </div>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="p-2.5 rounded-2xl bg-amber-50/60 flex items-center justify-between">
                      <span className="text-slate-900">1. Aditi Sharma</span>
                      <span className="text-amber-800 font-extrabold">96% (A+)</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                      <span className="text-slate-900">2. Kabir Jain</span>
                      <span className="text-slate-800 font-extrabold">93% (A+)</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                      <span className="text-slate-900">3. Anas Kashyap</span>
                      <span className="text-slate-800 font-extrabold">89% (A)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Results Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-base">Student Result Master List</h3>
                  <button
                    type="button"
                    onClick={() => triggerToast('Results published to student and parent portal.')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer"
                  >
                    Publish Results
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3 text-center">Total Marks</th>
                        <th className="py-2.5 px-3 text-center">Percentage</th>
                        <th className="py-2.5 px-3 text-center">Grade / GPA</th>
                        <th className="py-2.5 px-3 text-center">Result</th>
                        <th className="py-2.5 px-3 text-right">Report Card</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {ATTENDANCE_STUDENTS.slice(0, 7).map((s, idx) => {
                        const marksMap = [441, 410, 395, 370, 350, 480, 420];
                        const totalObtained = marksMap[idx % marksMap.length];
                        const percent = Math.round((totalObtained / 500) * 100);
                        const { grade, gpa } = calculateGradeAndGPA(percent);

                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                            <td className="py-3 px-3 text-slate-600">{s.rollNumber}</td>
                            <td className="py-3 px-3 text-slate-600">{s.className}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-900">{totalObtained} / 500</td>
                            <td className="py-3 px-3 text-center font-black text-[#FF6B2C]">{percent}%</td>
                            <td className="py-3 px-3 text-center font-bold">{grade} (GPA: {gpa})</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                PASS
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReportStudent(s);
                                  setIsReportModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6B2C] hover:underline"
                              >
                                Preview Report <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. REPORT CARDS TAB */}
          {activeTab === 'Report Cards' && (
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
                <button
                  type="button"
                  onClick={() => triggerToast('Generating report cards for all students in class...')}
                  className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs shrink-0 cursor-pointer"
                >
                  Generate All Report Cards
                </button>
              </div>

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
                    {filteredStudentsForReports.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 px-3 text-slate-600">{s.rollNumber}</td>
                        <td className="py-3 px-3 text-slate-600">{s.className}</td>
                        <td className="py-3 px-3 text-slate-400 font-medium">{s.id}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600">88.2%</td>
                        <td className="py-3 px-3 text-center font-black text-slate-900">A+</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReportStudent(s);
                              setIsReportModalOpen(true);
                            }}
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
            </div>
          )}
        </main>
      </div>

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateExam={handleCreateExam}
      />

      {/* Printable Report Card Modal */}
      <ReportCardPreviewModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        student={selectedReportStudent}
        examName={currentExam.name}
      />
    </div>
  );
};

export default ExamsPage;
