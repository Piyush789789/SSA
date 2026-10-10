import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, MapPin, User, Edit, Award } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ProfileAcademic } from '@/components/students/profile/ProfileAcademic';
import { ProfileFinance } from '@/components/students/profile/ProfileFinance';
import { ProfileCommunication } from '@/components/students/profile/ProfileCommunication';
import { ProfileCertificates } from '@/components/students/profile/ProfileCertificates';
import { AsyncState, ErrorMessage, LoadingMessage } from '@/components/common/AsyncState';
import { NotFoundCard } from '@/components/students/NotFoundCard';
import { useApi } from '@/hooks/useApi';
import { formatDate } from '@/utils';
import { HealthPanel } from '@/components/health/HealthPanel';
import { GovernmentRecords, StudentPhoto } from '@/components/students/GovernmentRecords';
import { useI18n } from '@/i18n/translate';
import { formatRate } from '@/components/attendance/attendanceMath';
import { ROUTES } from '@/constants/routes';
import { WhatsAppButton } from '@/components/whatsapp/WhatsAppComposer';

const TABS = ['Overview', 'Academic', 'Attendance', 'Health', 'Finance', 'Communication', 'Certificates'];

const AttendanceStatsBlock = ({ stats }) => (
  <AsyncState state={stats}>
    {(s) => (
      <>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-bold text-slate-900">{formatRate(s.rate)}</span>
          <span className="text-sm text-slate-500 mb-1">overall</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Present</span>
            <span className="font-medium text-slate-900">{s.present} days</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Late</span>
            <span className="font-medium text-slate-900">{s.late} days</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Absent</span>
            <span className="font-medium text-slate-900">{s.absent} days</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Leave</span>
            <span className="font-medium text-slate-900">{s.leave} days</span>
          </div>
        </div>
      </>
    )}
  </AsyncState>
);

export const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [activeSidebarId, setActiveSidebarId] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const { t } = useI18n();

  const studentState = useApi(`/students/${encodeURIComponent(studentId)}`);
  const student = studentState.data;
  const classInfo = useApi(student ? `/classes/${encodeURIComponent(student.className)}` : null);
  const stats = useApi(student ? `/attendance/students/${encodeURIComponent(student.id)}/stats` : null);

  const isNotFound = studentState.error?.status === 404;
  const guardian = student?.guardian || {};

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

          {isNotFound ? (
            <NotFoundCard
              title="Student not found"
              message={`No student with ID "${studentId}" exists. It may have been deleted.`}
              backLabel="Back to Students"
              onBack={() => navigate(ROUTES.ADMIN_STUDENTS)}
            />
          ) : studentState.error && !student ? (
            <ErrorMessage error={studentState.error} onRetry={studentState.reload} />
          ) : !student ? (
            <LoadingMessage text="Loading student…" />
          ) : (
            <>
              {/* Student Profile Header Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex items-center gap-6">
                  <StudentPhoto student={student} />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> ID: {student.id}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="font-medium text-slate-700">Class {student.className}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>Roll No: {student.rollNumber ?? '—'}</span>
                      {student.status && student.status !== 'Active' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {student.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                  <WhatsAppButton student={student} />
                  <Link
                    to={`/report-card/${encodeURIComponent(student.id)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-[#FF6B2C] text-sm font-medium rounded-lg transition-colors"
                  >
                    <Award className="w-4 h-4" /> View Report Card
                  </Link>
                  <button
                    type="button"
                    title="Edit student"
                    onClick={() => navigate(`${ROUTES.ADMIN_ADD_STUDENT}?edit=${encodeURIComponent(student.id)}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" /> Edit Student
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
                      {t(`profile.tab.${tab}`, null, tab)}
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
                            <p className="text-sm font-medium text-slate-900">{formatDate(student.dateOfBirth)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Gender</p>
                            <p className="text-sm font-medium text-slate-900">{student.gender || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Blood Group</p>
                            <p className="text-sm font-medium text-slate-900">{student.bloodGroup || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Class Teacher</p>
                            <p className="text-sm font-medium text-slate-900">
                              {classInfo.data ? classInfo.data.classTeacherName || 'Not assigned' : classInfo.error ? '—' : '…'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Admission Date</p>
                            <p className="text-sm font-medium text-slate-900">{formatDate(student.admissionDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Student Email</p>
                            <p className="text-sm font-medium text-slate-900">{student.email || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Parent Information */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Parent / Guardian Information</h3>
                        {student.guardian ? (
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{guardian.name}</p>
                                <p className="text-xs text-slate-500">{guardian.relation || '—'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-700">{guardian.phone || '—'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-700">{guardian.email || '—'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">No guardian details recorded.</p>
                        )}
                      </div>

                      {/* Government records (UDISE+ / APAAR / RTE) */}
                      <GovernmentRecords student={student} />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Attendance Summary */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Summary</h3>
                        <AttendanceStatsBlock stats={stats} />
                      </div>

                      {/* Address */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Address</h3>
                        <div className="flex gap-3">
                          <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                          <p className="text-sm text-slate-700 leading-relaxed">{student.address || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Academic' && <ProfileAcademic student={student} />}

                {activeTab === 'Attendance' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Student Attendance Records</h3>
                        <p className="text-xs text-slate-500">All recorded school days for {student.name} (holidays excluded)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/attendance/student/${student.id}`)}
                        className="px-4 py-2 bg-[#FF6B2C] text-white text-xs font-bold rounded-2xl shadow-xs hover:bg-[#e85a1c] transition-colors"
                      >
                        View Detailed Attendance Page
                      </button>
                    </div>
                    <AsyncState state={stats}>
                      {(s) => (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs text-slate-500">Overall Rate</p>
                            <h4 className="text-xl font-bold text-slate-900 mt-1">{formatRate(s.rate)}</h4>
                          </div>
                          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-xs text-emerald-700 font-medium">Days Present (incl. late)</p>
                            <h4 className="text-xl font-bold text-emerald-700 mt-1">{s.present + s.late}</h4>
                          </div>
                          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-xs text-rose-700 font-medium">Days Absent</p>
                            <h4 className="text-xl font-bold text-rose-700 mt-1">{s.absent}</h4>
                          </div>
                          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <p className="text-xs text-indigo-700 font-medium">Working Days</p>
                            <h4 className="text-xl font-bold text-indigo-700 mt-1">{s.workingDays}</h4>
                          </div>
                        </div>
                      )}
                    </AsyncState>
                  </div>
                )}

                {activeTab === 'Health' && (
                  <HealthPanel studentId={student.id} studentName={student.name} mode="staff" />
                )}
                {activeTab === 'Finance' && <ProfileFinance student={student} />}
                {activeTab === 'Communication' && <ProfileCommunication student={student} />}
                {activeTab === 'Certificates' && (
                  <ProfileCertificates student={student} onStudentChanged={studentState.reload} />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;
