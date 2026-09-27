import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StudentFilters } from '@/components/students/StudentFilters';
import { StudentTable } from '@/components/students/StudentTable';
import { studentsData } from '@/data/studentData';

export const StudentsPage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Live frontend filtering
  const filteredStudents = useMemo(() => {
    return studentsData.filter((student) => {
      // 1. Search term (Name or Roll Number)
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(student.rollNumber).includes(searchTerm.trim());

      // 2. Class filter
      const matchesClass =
        selectedClass === 'All' || student.className === selectedClass;

      // 3. Fee Status filter
      const matchesStatus =
        selectedStatus === 'All' ||
        student.feeStatus.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [searchTerm, selectedClass, selectedStatus]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col">
      {/* Sidebar Component */}
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        {/* Header */}
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Students Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-12">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Students
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                161 total students enrolled.
              </p>
            </div>

            {/* Add Student Primary Action Button */}
            <button
              type="button"
              onClick={() => {}}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Student</span>
            </button>
          </div>

          {/* Filter Toolbar */}
          <StudentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedClass={selectedClass}
            onClassChange={setSelectedClass}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />

          {/* Students Table */}
          <StudentTable students={filteredStudents} />
        </main>
      </div>
    </div>
  );
};

export default StudentsPage;
