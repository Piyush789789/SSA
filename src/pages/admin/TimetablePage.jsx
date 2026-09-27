import React, { useState } from 'react';
import { Settings, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  INITIAL_PERIODS,
  INITIAL_TIMETABLE_ENTRIES,
} from '@/data/timetableData';

import { SubjectLegend } from '@/components/timetable/SubjectLegend';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { EditTimetableEntryModal } from '@/components/timetable/EditTimetableEntryModal';
import { ManagePeriodsModal } from '@/components/timetable/ManagePeriodsModal';

export const TimetablePage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('timetable');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Selected Class (Default: Class 1-A)
  const [selectedClass, setSelectedClass] = useState('1-A');

  // Selected Legend Subject Filter
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Periods State
  const [periods, setPeriods] = useState(INITIAL_PERIODS);

  // Timetable Entries State
  const [entries, setEntries] = useState(INITIAL_TIMETABLE_ENTRIES);

  // Modal States
  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    cellData: null,
  });

  const [isManagePeriodsOpen, setIsManagePeriodsOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const classOptions = [
    '1-A',
    '1-B',
    '2-A',
    '2-B',
    '3-A',
    '3-B',
    '4-A',
    '4-B',
    '5-A',
    '5-B',
    '6-A',
    '6-B',
    '7-A',
    '7-B',
    '8-A',
    '8-B',
    '9-A',
    '9-B',
    '10-A',
    '10-B',
  ];

  // Open Edit Entry Modal on cell click
  const handleCellClick = (day, period, entry) => {
    setEditModalState({
      isOpen: true,
      cellData: {
        classId: selectedClass,
        day,
        period,
        entry,
      },
    });
  };

  // Save Timetable Entry (Subject & Teacher / Substitute)
  const handleSaveEntry = (updatedEntryData) => {
    const { classId, day, periodId, subjectId, teacherName, substituteTeacherName } =
      updatedEntryData;

    setEntries((prev) => {
      const existingIdx = prev.findIndex(
        (e) => e.classId === classId && e.day === day && e.periodId === periodId
      );

      const newEntry = {
        classId,
        day,
        periodId,
        subjectId,
        teacherName,
        substituteTeacherName,
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newEntry;
        return copy;
      }
      return [...prev, newEntry];
    });

    setEditModalState({ isOpen: false, cellData: null });
    if (substituteTeacherName) {
      triggerToast('Substitute teacher assigned for this day.');
    } else {
      triggerToast('Timetable entry updated successfully.');
    }
  };

  // Clear Timetable Entry
  const handleClearEntry = ({ classId, day, periodId }) => {
    setEntries((prev) =>
      prev.filter(
        (e) => !(e.classId === classId && e.day === day && e.periodId === periodId)
      )
    );

    setEditModalState({ isOpen: false, cellData: null });
    triggerToast('Timetable entry cleared.');
  };

  // Add Period Row
  const handleAddPeriod = (newPeriod) => {
    setPeriods((prev) => [...prev, newPeriod]);
    triggerToast(`New period row "${newPeriod.label}" added.`);
  };

  // Delete Period Row
  const handleDeletePeriod = (periodId) => {
    setPeriods((prev) => prev.filter((p) => p.id !== periodId));
    setEntries((prev) => prev.filter((e) => e.periodId !== periodId));
    triggerToast('Period row removed.');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm">{toastMessage}</span>
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

        {/* Timetable Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Weekly Timetable
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                View and manage class schedules
              </p>
            </div>

            {/* Top Right Controls (Class Selector & Manage Periods Button) */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-auto">
              {/* Class Selector Dropdown */}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>

              {/* Manage Periods Button */}
              <button
                type="button"
                onClick={() => setIsManagePeriodsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Manage Periods</span>
              </button>
            </div>
          </div>

          {/* Subject Legend Bar */}
          <SubjectLegend
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={setSelectedSubjectId}
          />

          {/* Timetable Grid */}
          <TimetableGrid
            periods={periods}
            entries={entries}
            classId={selectedClass}
            selectedSubjectId={selectedSubjectId}
            onCellClick={handleCellClick}
          />
        </main>
      </div>

      {/* Edit Entry Modal */}
      <EditTimetableEntryModal
        isOpen={editModalState.isOpen}
        cellData={editModalState.cellData}
        onClose={() => setEditModalState({ isOpen: false, cellData: null })}
        onSave={handleSaveEntry}
        onClear={handleClearEntry}
      />

      {/* Manage Periods Modal */}
      <ManagePeriodsModal
        isOpen={isManagePeriodsOpen}
        periods={periods}
        onClose={() => setIsManagePeriodsOpen(false)}
        onAddPeriod={handleAddPeriod}
        onDeletePeriod={handleDeletePeriod}
      />
    </div>
  );
};

export default TimetablePage;
