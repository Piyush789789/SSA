import React, { useMemo, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceOverview } from '@/components/dashboard/AttendanceOverview';
import { FeeCollectionChart } from '@/components/dashboard/FeeCollectionChart';
import { feeChartStart } from '@/components/dashboard/dashboardDates';
import { ClassPerformance } from '@/components/dashboard/ClassPerformance';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingExams } from '@/components/dashboard/UpcomingExams';
import { PendingFees } from '@/components/dashboard/PendingFees';
import { SchoolCalendar } from '@/components/dashboard/SchoolCalendar';
import { AsyncState } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { addDays, formatCurrency, todayIso } from '@/utils';
import { formatRate } from '@/components/attendance/attendanceMath';

const Card = ({ children }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs h-full">{children}</div>
);

export const AdminDashboard = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [today] = useState(todayIso);
  const dashboard = useApi('/dashboard');
  // Last 30 days of attendance feed the weekly chart and the class-wise chart.
  const attendance = useApi(withQuery('/attendance', { from: addDays(today, -29), to: today }));
  const payments = useApi(withQuery('/fees/payments', { from: feeChartStart(today), to: today }));
  const dues = useApi('/fees/dues');

  const stats = useMemo(() => {
    const d = dashboard.data;
    if (!d) return [];
    const rate = d.todayAttendance?.rate;
    return [
      {
        id: 'students',
        title: 'Total Students',
        value: d.totalStudents,
        type: 'students',
        gradient: 'from-[#FF7A45] to-[#FA5A19]',
      },
      {
        id: 'teachers',
        title: 'Total Teachers',
        value: d.totalTeachers,
        type: 'teachers',
        gradient: 'from-[#6979F8] to-[#4A54E1]',
      },
      {
        id: 'attendance',
        title: "Today's Attendance",
        value: rate === null || rate === undefined ? 'Not marked' : formatRate(rate),
        type: 'attendance',
        gradient: 'from-[#36CFC9] to-[#08979C]',
      },
      {
        id: 'fees',
        title: 'Fees Collected',
        value: formatCurrency(d.fees?.collected),
        type: 'fees',
        gradient: 'from-[#FF7A45] to-[#E04E15]',
      },
    ];
  }, [dashboard.data]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col">
      {/* Sidebar Component */}
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Page Content Wrapper (Offset for 310px sidebar on desktop) */}
      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        {/* Header */}
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Dashboard Body Content (Vertically Scrollable) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1600px] w-full mx-auto pb-12">
          {/* Dashboard Title & Welcome Banner */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
              Welcome back! Here's what's happening today.
            </p>
          </div>

          {/* 1. Summary Stat Cards (4 in a row on desktop) */}
          <AsyncState state={dashboard} loadingText="Loading dashboard…">
            {() => (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat) => (
                  <StatCard key={stat.id} stat={stat} />
                ))}
              </div>
            )}
          </AsyncState>

          {/* 2. Middle Row: Attendance Overview (60%) & Fee Collection Chart (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <AsyncState state={attendance}>
                {(records) => <AttendanceOverview records={records} today={today} />}
              </AsyncState>
            </div>
            <div className="lg:col-span-5">
              <AsyncState state={payments}>
                {(list) => <FeeCollectionChart payments={list} today={today} />}
              </AsyncState>
            </div>
          </div>

          {/* 3. Lower Row: Class Attendance (60%) & Recent Activity (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <AsyncState state={attendance}>
                {(records) => <ClassPerformance records={records} periodLabel="Last 30 days" />}
              </AsyncState>
            </div>
            <div className="lg:col-span-5">
              {dashboard.data && payments.data ? (
                <RecentActivity payments={payments.data} notices={dashboard.data.recentNotices || []} />
              ) : (
                <Card>
                  <AsyncState state={[dashboard, payments]}>{() => null}</AsyncState>
                </Card>
              )}
            </div>
          </div>

          {/* 4. Bottom Three-Column Section: Upcoming Exams, Pending Fees, School Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-stretch">
            <div className="xl:col-span-4">
              {dashboard.data ? (
                <UpcomingExams papers={dashboard.data.upcomingExams || []} today={today} />
              ) : (
                <Card>
                  <AsyncState state={dashboard}>{() => null}</AsyncState>
                </Card>
              )}
            </div>
            <div className="xl:col-span-4">
              {dues.data ? (
                <PendingFees
                  dues={dues.data}
                  studentsWithDues={dashboard.data?.fees?.studentsWithDues}
                  depositsToVerify={dashboard.data?.depositsToVerify || 0}
                />
              ) : (
                <Card>
                  <AsyncState state={dues}>{() => null}</AsyncState>
                </Card>
              )}
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              {dashboard.data ? (
                <SchoolCalendar papers={dashboard.data.upcomingExams || []} today={today} />
              ) : (
                <Card>
                  <AsyncState state={dashboard}>{() => null}</AsyncState>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
