import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Layers,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  INITIAL_EXAMS,
  INITIAL_SCHEDULES,
  EXAM_STATUS_STYLES
} from "@/data/examsData";
import { AddExamScheduleModal } from "@/components/exams/AddExamScheduleModal";

export const ExamDetailPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [activeSidebarId, setActiveSidebarId] = useState("exams");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Find exam
  const exam = INITIAL_EXAMS.find(
    (e) => e.id === examId || e.name.toLowerCase().replace(/\s+/g, "-") === examId
  ) || INITIAL_EXAMS[0];

  const [schedules, setSchedules] = useState(
    INITIAL_SCHEDULES.filter(
      (s) => s.examId === exam.id || s.examName === exam.name
    )
  );

  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");

  const handleAddSchedule = (newSched) => {
    setSchedules((prev) => [
      ...prev,
      {
        id: `SCH-${Date.now()}`,
        examId: exam.id,
        examName: exam.name,
        status: "Scheduled",
        ...newSched
      }
    ]);
  };

  const handleDeleteSchedule = (id) => {
    if (window.confirm("Are you sure you want to remove this subject schedule?")) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filteredSchedules = selectedClassFilter === "ALL"
    ? schedules
    : schedules.filter((s) => s.className === selectedClassFilter);

  const totalClasses = exam.classes ? exam.classes.length : 10;

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          <div className="space-y-6 pb-12">
            {/* Back navigation */}
            <div>
              <button
                onClick={() => navigate("/admin/exams")}
                className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Exams &amp; Results
              </button>
            </div>

            {/* Header Banner */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${EXAM_STATUS_STYLES[exam.status] || "bg-slate-100 text-slate-700"}`}>
                    {exam.status}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    Academic Year: {exam.academicYear}
                  </span>
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    {exam.type}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{exam.name}</h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{exam.startDate} — {exam.endDate}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/admin/exams"
                  state={{ activeTab: "marksEntry", selectedExam: exam.id }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-blue-200"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Enter Marks
                </Link>
                <button
                  onClick={() => setIsAddScheduleOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Subject / Schedule
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Classes</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{totalClasses}</div>
                <div className="text-xs text-slate-400 mt-1">Target Classes</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Subjects</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{schedules.length}</div>
                <div className="text-xs text-slate-400 mt-1">Scheduled papers</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Students</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{exam.studentsCount || 420}</div>
                <div className="text-xs text-slate-400 mt-1">Total Enrolled</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Marks Completion</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{exam.completionRate || 86}%</div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${exam.completionRate || 86}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Results</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-2">{exam.resultStatus || "Pending"}</div>
                <div className="text-xs text-slate-400 mt-1">Publication status</div>
              </div>
            </div>

            {/* Classes Assigned List */}
            {exam.classes && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Target Classes for this Examination</h3>
                <div className="flex flex-wrap gap-2">
                  {exam.classes.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClassFilter(cls === selectedClassFilter ? "ALL" : cls)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedClassFilter === cls
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                  {selectedClassFilter !== "ALL" && (
                    <button
                      onClick={() => setSelectedClassFilter("ALL")}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
                    >
                      Show All Classes
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Subject Exam Schedule Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Exam Subject Schedule</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Date, timings, maximum and passing marks for each paper
                  </p>
                </div>
                <button
                  onClick={() => setIsAddScheduleOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Subject / Schedule
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4">Exam Date</th>
                      <th className="py-3.5 px-4">Timings</th>
                      <th className="py-3.5 px-4 text-center">Max Marks</th>
                      <th className="py-3.5 px-4 text-center">Passing Marks</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredSchedules.length > 0 ? (
                      filteredSchedules.map((sched) => (
                        <tr key={sched.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {sched.subject}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                              {sched.className}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {sched.date}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">
                            {sched.startTime} - {sched.endTime}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                            {sched.maxMarks}
                          </td>
                          <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                            {sched.passingMarks}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {sched.status || "Scheduled"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                title="Edit schedule"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(sched.id)}
                                title="Delete schedule"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No subject exam schedule found for the selected criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Schedule Modal */}
      {isAddScheduleOpen && (
        <AddExamScheduleModal
          isOpen={isAddScheduleOpen}
          onClose={() => setIsAddScheduleOpen(false)}
          onAdd={handleAddSchedule}
          examName={exam.name}
        />
      )}
    </div>
  );
};
