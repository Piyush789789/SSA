import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceOverview } from '@/components/dashboard/AttendanceOverview';
import { FeeCollectionChart } from '@/components/dashboard/FeeCollectionChart';
import { ClassPerformance } from '@/components/dashboard/ClassPerformance';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingExams } from '@/components/dashboard/UpcomingExams';
import { PendingFees } from '@/components/dashboard/PendingFees';
import { SchoolCalendar } from '@/components/dashboard/SchoolCalendar';
import { dashboardStats } from '@/data/dashboardData';

export const AdminDashboard = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {dashboardStats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>

          {/* 2. Middle Row: Attendance Overview (60%) & Fee Collection Chart (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <AttendanceOverview />
            </div>
            <div className="lg:col-span-5">
              <FeeCollectionChart />
            </div>
          </div>

          {/* 3. Lower Row: Class Performance (60%) & Recent Activity (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <ClassPerformance />
            </div>
            <div className="lg:col-span-5">
              <RecentActivity />
            </div>
          </div>

          {/* 4. Bottom Three-Column Section: Upcoming Exams, Pending Fees, School Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-stretch">
            <div className="xl:col-span-4">
              <UpcomingExams />
            </div>
            <div className="xl:col-span-4">
              <PendingFees />
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <SchoolCalendar />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
