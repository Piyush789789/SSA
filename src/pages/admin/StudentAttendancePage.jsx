import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CalendarCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ATTENDANCE_STUDENTS } from '@/data/attendanceData';
import { AttendanceStatusBadge } from '@/components/attendance/AttendanceStatusBadge';

export const StudentAttendancePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [activeSidebarId, setActiveSidebarId] = useState('attendance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const student = ATTENDANCE_STUDENTS.find(
    (s) => s.id === studentId || s.id === `STU-2026-${studentId?.padStart(4, '0')}`
  ) || {
    id: studentId || 'STU-2026-0005',
    name: 'Aditi Sharma',
    className: '1-B',
    rollNumber: 1,
    email: 'aditi.s@ssa.edu.in',
  };

  const dailyLogs = [
    { date: '28 Sep 2026', day: 'Monday', status: 'present', checkIn: '08:02 AM', remarks: '—' },
    { date: '27 Sep 2026', day: 'Sunday', status: 'holiday', checkIn: '—', remarks: 'School Holiday' },
    { date: '26 Sep 2026', day: 'Saturday', status: 'absent', checkIn: '—', remarks: 'Medical Leave' },
    { date: '25 Sep 2026', day: 'Friday', status: 'present', checkIn: '08:01 AM', remarks: '—' },
    { date: '24 Sep 2026', day: 'Thursday', status: 'present', checkIn: '08:05 AM', remarks: '—' },
    { date: '23 Sep 2026', day: 'Wednesday', status: 'present', checkIn: '07:59 AM', remarks: '—' },
    { date: '22 Sep 2026', day: 'Tuesday', status: 'present', checkIn: '08:02 AM', remarks: '—' },
    { date: '21 Sep 2026', day: 'Monday', status: 'present', checkIn: '08:00 AM', remarks: '—' },
  ];

  const monthlyLogs = [
    { month: 'September 2026', present: 18, absent: 2, late: 1, total: 21, rate: '85.7%' },
    { month: 'August 2026', present: 21, absent: 3, late: 0, total: 24, rate: '87.5%' },
    { month: 'July 2026', present: 19, absent: 1, late: 0, total: 20, rate: '95.0%' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto pb-16">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate('/admin/attendance')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#FF6B2C] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attendance Dashboard
          </button>

          {/* Student Profile Card Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#FF6B2C] font-black text-lg flex items-center justify-center shrink-0 border border-orange-200">
                {student.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {student.name}
                </h1>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  ID: <span className="text-slate-700 font-bold">{student.id}</span> • Class:{' '}
                  <span className="text-slate-700 font-bold">{student.className}</span> • Roll No:{' '}
                  <span className="text-slate-700 font-bold">{student.rollNumber}</span>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-black text-sm">
              <CalendarCheck className="w-4 h-4" />
              <span>Overall Rate: 88%</span>
            </div>
          </div>

          {/* Student Stats Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Present Days</p>
                <h3 className="text-xl font-extrabold text-emerald-600">21 Days</h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Absent Days</p>
                <h3 className="text-xl font-extrabold text-rose-600">3 Days</h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Late Days</p>
                <h3 className="text-xl font-extrabold text-amber-600">0 Days</h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Days</p>
                <h3 className="text-xl font-extrabold text-indigo-600">24 Days</h3>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
            {['overview', 'daily', 'monthly'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'border-b-2 border-[#FF6B2C] text-[#FF6B2C]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab} Attendance
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'monthly' ? (
            /* Monthly Summary Table */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Month-by-Month Attendance Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3">Present</th>
                      <th className="py-2.5 px-3">Absent</th>
                      <th className="py-2.5 px-3">Late</th>
                      <th className="py-2.5 px-3">Total Working Days</th>
                      <th className="py-2.5 px-3">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {monthlyLogs.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{m.month}</td>
                        <td className="py-3 px-3 text-emerald-600 font-bold">{m.present}</td>
                        <td className="py-3 px-3 text-rose-600 font-bold">{m.absent}</td>
                        <td className="py-3 px-3 text-amber-600 font-bold">{m.late}</td>
                        <td className="py-3 px-3 text-slate-600">{m.total}</td>
                        <td className="py-3 px-3 text-[#FF6B2C] font-extrabold">{m.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Daily Records Table */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Daily Attendance History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Day</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Check-in Time</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {dailyLogs.map((log) => (
                      <tr key={log.date} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{log.date}</td>
                        <td className="py-3 px-3 text-slate-600">{log.day}</td>
                        <td className="py-3 px-3">
                          <AttendanceStatusBadge status={log.status} />
                        </td>
                        <td className="py-3 px-3 text-slate-600">{log.checkIn}</td>
                        <td className="py-3 px-3 text-slate-400 font-normal">{log.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
