import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  DollarSign,
  Award,
  BookOpen,
  Calendar,
  FileCheck,
  Megaphone,
  UserCheck,
  Plus,
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CLASSES_MASTER } from '@/data/classesData';
import { ATTENDANCE_STUDENTS } from '@/data/attendanceData';
import { studentsData } from '@/data/studentData';
import { AttendanceStatusBadge } from '@/components/attendance/AttendanceStatusBadge';

export const ClassDetailPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [activeSidebarId, setActiveSidebarId] = useState('classes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Find class details
  const targetId = classId || '10-A';
  const classDetails = CLASSES_MASTER.find(
    (c) => c.id === targetId || c.name === `Class ${targetId}`
  ) || CLASSES_MASTER[0];

  // Students belonging to THIS CLASS
  const classStudents = ATTENDANCE_STUDENTS.filter(
    (s) => s.className === targetId || s.className === classDetails.id
  );

  // Filter students by search query
  const filteredClassStudents = classStudents.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      String(s.rollNumber).includes(q)
    );
  });

  const TABS = [
    'Overview',
    'Students',
    'Attendance',
    'Fees',
    'Academics',
    'Exams & Results',
    'Teachers & Subjects',
    'Timetable',
    'Homework',
    'Achievements',
  ];

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
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate('/admin/classes')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#FF6B2C] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes Overview
          </button>

          {/* Class Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#FF6B2C] font-black text-xl flex items-center justify-center shrink-0 border border-orange-200">
                {classDetails.name.replace('Class ', '')}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {classDetails.name}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-orange-50 text-[#FF6B2C] font-extrabold text-xs border border-orange-100">
                    Section {classDetails.section}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Class Teacher:{' '}
                  <span className="text-slate-800 font-bold">{classDetails.classTeacher}</span> • Academic Year:{' '}
                  <span className="text-slate-800 font-bold">{classDetails.academicYear}</span> • Classroom:{' '}
                  <span className="text-slate-800 font-bold">{classDetails.room}</span> •{' '}
                  <span className="text-emerald-600 font-bold">{classDetails.totalStudents} Students</span>
                </p>
              </div>
            </div>

            {/* Quick Actions (Pre-selected for THIS CLASS) */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => navigate(`/admin/students/add?class=${classDetails.id}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF6B2C]" />
                <span>Add Student</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/admin/attendance?class=${classDetails.id}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/fees?class=${classDetails.id}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>Collect Fee</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/admin/timetable?class=${classDetails.id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-[#FF6B2C]/20"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>View Timetable</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
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

          {/* Tab Content */}
          <div className="space-y-6">
            {/* OVERVIEW TAB (Default Dashboard Snapshot) */}
            {activeTab === 'Overview' && (
              <>
                {/* 1. Class Top Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Students</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1">{classDetails.totalStudents}</h3>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Today's Attendance</p>
                    <h3 className="text-xl font-black text-emerald-700 mt-1">{classDetails.todayPresent} / {classDetails.totalStudents}</h3>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Attendance Rate</p>
                    <h3 className="text-xl font-black text-[#FF6B2C] mt-1">{classDetails.attendanceRate}</h3>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Fees Collected</p>
                    <h3 className="text-xl font-black text-slate-900 mt-1">{classDetails.feesCollected}</h3>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <p className="text-[10px] font-bold text-amber-700 uppercase">Pending Fees</p>
                    <h3 className="text-xl font-black text-amber-700 mt-1">{classDetails.pendingFees}</h3>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <p className="text-[10px] font-bold text-indigo-700 uppercase">Average Result</p>
                    <h3 className="text-xl font-black text-indigo-700 mt-1">{classDetails.averageResult}</h3>
                  </div>
                </div>

                {/* 2. Class Health Snapshot Indicators */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm mb-3">Class Health &amp; Performance Indicators</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">ACADEMIC</p>
                      <h4 className="font-black text-emerald-800 text-xs mt-0.5">Good (78.4%)</h4>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">ATTENDANCE</p>
                      <h4 className="font-black text-emerald-800 text-xs mt-0.5">Excellent (94.2%)</h4>
                    </div>
                    <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
                      <p className="text-[10px] font-bold text-amber-800 uppercase">FEES</p>
                      <h4 className="font-black text-amber-800 text-xs mt-0.5">90% Collected</h4>
                    </div>
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-2xl">
                      <p className="text-[10px] font-bold text-indigo-800 uppercase">HOMEWORK</p>
                      <h4 className="font-black text-indigo-800 text-xs mt-0.5">92% Completion</h4>
                    </div>
                    <div className="p-3 bg-orange-50/70 border border-orange-200/60 rounded-2xl">
                      <p className="text-[10px] font-bold text-orange-800 uppercase">EXAMS</p>
                      <h4 className="font-black text-orange-800 text-xs mt-0.5">1 Upcoming</h4>
                    </div>
                  </div>
                </div>

                {/* 3. Class Students Preview */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-[#FF6B2C]" />
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Class Roster ({classStudents.length} Students)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/students?class=${classDetails.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B2C] hover:underline"
                    >
                      View All Students <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">Student ID</th>
                          <th className="py-2.5 px-3">Roll No</th>
                          <th className="py-2.5 px-3">Attendance</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        {classStudents.slice(0, 5).map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                            <td className="py-3 px-3 text-slate-500">{s.id}</td>
                            <td className="py-3 px-3 text-slate-600">{s.rollNumber}</td>
                            <td className="py-3 px-3 text-emerald-600 font-bold">94%</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Subject Teachers & Timetable Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Subject Teachers */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-extrabold text-slate-900 text-sm">Assigned Teachers</h3>
                      <span className="text-xs text-slate-400">{classDetails.teachers.length} Subject Teachers</span>
                    </div>

                    <div className="space-y-2.5">
                      {classDetails.teachers.map((t) => (
                        <div key={t.subject} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <h4 className="font-bold text-slate-900">{t.subject}</h4>
                            <p className="text-[11px] text-slate-400">{t.teacherName}</p>
                          </div>
                          {t.isClassTeacher && (
                            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B2C] text-[10px] font-extrabold border border-orange-200">
                              Class Teacher
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Today's Timetable */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-extrabold text-slate-900 text-sm">Today's Timetable</h3>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/timetable?class=${classDetails.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B2C] hover:underline"
                      >
                        View Full Timetable <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {classDetails.todayTimetable.map((period, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">{period.time}</span>
                            <h4 className="font-bold text-slate-900">{period.subject}</h4>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500">{period.teacher}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* STUDENTS TAB */}
            {activeTab === 'Students' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student by name, roll no or student ID..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/students?class=${classDetails.id}`)}
                    className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs shrink-0 cursor-pointer"
                  >
                    View All Students Module
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Student ID</th>
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Attendance</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {filteredClassStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">
                            No students match the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredClassStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                            <td className="py-3 px-3 text-slate-500">{s.id}</td>
                            <td className="py-3 px-3 text-slate-600">{s.rollNumber}</td>
                            <td className="py-3 px-3 text-slate-500 font-normal">{s.email}</td>
                            <td className="py-3 px-3 text-emerald-600 font-bold">92%</td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/attendance/student/${s.id}`)}
                                className="text-[11px] font-bold text-[#FF6B2C] hover:underline"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === 'Attendance' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Class Attendance Breakdown</h3>
                    <p className="text-xs text-slate-400">Attendance records for {classDetails.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/attendance?class=${classDetails.id}`)}
                    className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer"
                  >
                    View Full Attendance Module
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800">Present Today</p>
                    <h4 className="text-xl font-black text-emerald-800 mt-1">{classDetails.todayPresent}</h4>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-xs font-bold text-rose-800">Absent Today</p>
                    <h4 className="text-xl font-black text-rose-800 mt-1">{classDetails.todayAbsent}</h4>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800">Late Today</p>
                    <h4 className="text-xl font-black text-amber-800 mt-1">{classDetails.todayLate}</h4>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-xs font-bold text-orange-800">Attendance Rate</p>
                    <h4 className="text-xl font-black text-[#FF6B2C] mt-1">{classDetails.attendanceRate}</h4>
                  </div>
                </div>
              </div>
            )}

            {/* FEES TAB */}
            {activeTab === 'Fees' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Class Fee Collection Overview</h3>
                    <p className="text-xs text-slate-400">Financial summary for {classDetails.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/fees?class=${classDetails.id}`)}
                    className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer"
                  >
                    Manage Class Fees Module
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500">Total Expected</p>
                    <h4 className="text-xl font-black text-slate-900 mt-1">{classDetails.feesExpected}</h4>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800">Total Collected</p>
                    <h4 className="text-xl font-black text-emerald-800 mt-1">{classDetails.feesCollected}</h4>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800">Total Pending</p>
                    <h4 className="text-xl font-black text-amber-800 mt-1">{classDetails.pendingFees}</h4>
                  </div>
                </div>
              </div>
            )}

            {/* ACADEMICS TAB */}
            {activeTab === 'Academics' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                <h3 className="font-extrabold text-slate-900 text-base">Academic Performance &amp; Rankings</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500">Average Result</p>
                    <h4 className="text-xl font-black text-slate-900 mt-1">{classDetails.averageResult}</h4>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800">Pass Percentage</p>
                    <h4 className="text-xl font-black text-emerald-800 mt-1">{classDetails.passPercentage}</h4>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-800">Highest Marks</p>
                    <h4 className="text-xl font-black text-indigo-800 mt-1">{classDetails.highestMarks}</h4>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800">Lowest Marks</p>
                    <h4 className="text-xl font-black text-amber-800 mt-1">{classDetails.lowestMarks}</h4>
                  </div>
                </div>
              </div>
            )}

            {/* EXAMS & RESULTS TAB */}
            {activeTab === 'Exams & Results' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Class Exams, Results &amp; Report Cards</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Academic examinations and performance summary for {classDetails.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/exams?class=${classDetails.id}`)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    Open Exams &amp; Results Module ({classDetails.id})
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase">Upcoming Exam</p>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1">{classDetails.upcomingExam}</h4>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 uppercase">Pass Rate</p>
                    <h4 className="text-xl font-black text-emerald-800 mt-1">{classDetails.passPercentage}</h4>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-800 uppercase">Class Average</p>
                    <h4 className="text-xl font-black text-indigo-800 mt-1">{classDetails.averageResult}</h4>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase">Top Performer</p>
                    <h4 className="text-base font-extrabold text-amber-900 mt-1">Aditi Sharma (96%)</h4>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-[#FF6B2C]" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Mid-Term Examination 2026-27</h4>
                      <p className="text-xs text-slate-500">Results published • 42 Students Appeared</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/exams?class=${classDetails.id}&tab=results`)}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    View Class Results
                  </button>
                </div>
              </div>
            )}

            {/* TEACHERS & SUBJECTS TAB */}
            {activeTab === 'Teachers & Subjects' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Assigned Subject Teachers</h3>
                <div className="space-y-3">
                  {classDetails.teachers.map((t) => (
                    <div key={t.subject} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-semibold">
                      <span className="font-bold text-slate-900">{t.subject}</span>
                      <span className="text-slate-600">{t.teacherName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIMETABLE TAB */}
            {activeTab === 'Timetable' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-base">Today's Class Timetable</h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/timetable?class=${classDetails.id}`)}
                    className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer"
                  >
                    View Full Timetable Module
                  </button>
                </div>
                <div className="space-y-3">
                  {classDetails.todayTimetable.map((period, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">{period.time}</span>
                      <span className="font-bold text-slate-900">{period.subject}</span>
                      <span className="text-slate-600">{period.teacher}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HOMEWORK TAB */}
            {activeTab === 'Homework' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Assigned Class Homework</h3>
                {classDetails.recentHomework.length === 0 ? (
                  <p className="text-xs text-slate-400">No homework assigned recently.</p>
                ) : (
                  classDetails.recentHomework.map((hw) => (
                    <div key={hw.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900">{hw.title}</h4>
                        <p className="text-slate-500">{hw.subject} • Due: {hw.dueDate}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-xs">
                        {hw.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'Achievements' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Class Achievements &amp; Accolades</h3>
                {classDetails.achievements.length === 0 ? (
                  <p className="text-xs text-slate-400">No achievements recorded yet.</p>
                ) : (
                  classDetails.achievements.map((ach) => (
                    <div key={ach.id} className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/60 flex items-center gap-3 text-xs">
                      <Award className="w-5 h-5 text-[#FF6B2C] shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-slate-900">{ach.title}</h4>
                        <p className="text-slate-500">{ach.category} • {ach.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClassDetailPage;
