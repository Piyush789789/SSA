import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, Calendar, MapPin, User, Download, Edit } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ProfileAcademic } from '@/components/students/profile/ProfileAcademic';
import { ProfileFinance } from '@/components/students/profile/ProfileFinance';
import { ProfileCommunication } from '@/components/students/profile/ProfileCommunication';
import { ProfileDocuments } from '@/components/students/profile/ProfileDocuments';
import { studentsData } from '@/data/studentData';
import { ROUTES } from '@/constants/routes';

export const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [activeSidebarId, setActiveSidebarId] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  // Assuming studentId is the numeric id in URL, e.g. /admin/students/2
  const student = studentsData.find((s) => String(s.id) === String(studentId)) || studentsData[0];

  const TABS = ['Overview', 'Academic', 'Attendance', 'Finance', 'Communication', 'Documents'];

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col">
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-12">
          {/* Back Button */}
          <button
            onClick={() => navigate(ROUTES.ADMIN_STUDENTS)}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Students
          </button>

          {/* Student Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-inner">
                {student.initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> ID: {student.studentId}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="font-medium text-slate-700">Class {student.className}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>Roll No: {student.rollNumber}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors">
                <Edit className="w-5 h-5" />
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors">
                <Download className="w-4 h-4" /> Download ID Card
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Details) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Date of Birth</p>
                        <p className="text-sm font-medium text-slate-900">{student.dob}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Gender</p>
                        <p className="text-sm font-medium text-slate-900">{student.gender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Blood Group</p>
                        <p className="text-sm font-medium text-slate-900">{student.bloodGroup}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Class Teacher</p>
                        <p className="text-sm font-medium text-slate-900">{student.classTeacher}</p>
                      </div>
                    </div>
                  </div>

                  {/* Parent Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Parent Information</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{student.parent.name}</p>
                          <p className="text-xs text-slate-500">{student.parent.relation}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{student.parent.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{student.parent.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Attendance Summary */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Summary</h3>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-3xl font-bold text-slate-900">{student.attendance}%</span>
                      <span className="text-sm text-slate-500 mb-1">overall</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Present</span>
                        <span className="font-medium text-slate-900">{student.attendanceStats.present} days</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Absent</span>
                        <span className="font-medium text-slate-900">{student.attendanceStats.absent} days</span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Address</h3>
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                      <p className="text-sm text-slate-700 leading-relaxed">{student.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'Academic' && (
               <ProfileAcademic student={student} />
            )}
            {activeTab === 'Attendance' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Student Attendance Records</h3>
                    <p className="text-xs text-slate-500">Detailed daily and monthly logs for {student.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/attendance/student/${student.studentId}`)}
                    className="px-4 py-2 bg-[#FF6B2C] text-white text-xs font-bold rounded-2xl shadow-xs hover:bg-[#e85a1c] transition-colors"
                  >
                    View Detailed Attendance Page
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500">Overall Rate</p>
                    <h4 className="text-xl font-bold text-slate-900 mt-1">{student.attendance}%</h4>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs text-emerald-700 font-medium">Days Present</p>
                    <h4 className="text-xl font-bold text-emerald-700 mt-1">{student.attendanceStats.present}</h4>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-xs text-rose-700 font-medium">Days Absent</p>
                    <h4 className="text-xl font-bold text-rose-700 mt-1">{student.attendanceStats.absent}</h4>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-xs text-indigo-700 font-medium">Total Days</p>
                    <h4 className="text-xl font-bold text-indigo-700 mt-1">{student.attendanceStats.totalDays}</h4>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Finance' && (
               <ProfileFinance student={student} />
            )}
            {activeTab === 'Communication' && (
               <ProfileCommunication student={student} />
            )}
            {activeTab === 'Documents' && (
               <ProfileDocuments student={student} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;
