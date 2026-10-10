import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { useAuth } from '@/context/AuthContext';

export const StudentLayout = () => {
  const { currentUser, role } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col">
      {/* Student Sidebar Component */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area Offset for desktop sidebar (310px) */}
      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <StudentHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1600px] w-full mx-auto pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
