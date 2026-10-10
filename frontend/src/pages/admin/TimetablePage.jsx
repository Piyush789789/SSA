import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SubjectLegend } from '@/components/timetable/SubjectLegend';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { EditTimetableEntryModal } from '@/components/timetable/EditTimetableEntryModal';
import { ManagePeriodsModal } from '@/components/timetable/ManagePeriodsModal';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http, withQuery } from '@/api/http';

export const TimetablePage = () => {
  const [searchParams] = useSearchParams();
  const [activeSidebarId, setActiveSidebarId] = useState('timetable');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const classes = useApi('/classes');
  const periods = useApi('/timetable/periods');
  const teachers = useApi('/teachers');
  const meta = useApi('/meta');

  const classOptions = useMemo(
    () => (classes.data || []).map((c) => c.id).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [classes.data],
  );
  const [chosenClass, setChosenClass] = useState(searchParams.get('class') || '');
  const selectedClass = chosenClass || classOptions[0] || '';

  const entries = useApi(selectedClass ? withQuery('/timetable', { className: selectedClass }) : null);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editModalState, setEditModalState] = useState({ isOpen: false, cellData: null });
  const [isManagePeriodsOpen, setIsManagePeriodsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const subjectsInUse = useMemo(
    () => [...new Set((entries.data || []).map((e) => e.subject))].sort(),
    [entries.data],
  );

  const handleCellClick = (day, period, entry) => {
    setEditModalState({ isOpen: true, cellData: { classId: selectedClass, day, period, entry } });
  };

  const closeEditModal = () => setEditModalState({ isOpen: false, cellData: null });

  // PUT /timetable/entries — errors are shown inside the modal.
  const handleSaveEntry = async (request) => {
    await http.put('/timetable/entries', request);
    closeEditModal();
    triggerToast('Timetable entry saved.');
    entries.reload();
  };

  const handleClearEntry = async (entry) => {
    await http.delete(`/timetable/entries/${encodeURIComponent(entry.id)}`);
    closeEditModal();
    triggerToast('Timetable entry cleared.');
    entries.reload();
  };

  // PUT /timetable/periods replaces the whole list.
  const savePeriods = async (nextPeriods, message) => {
    const saved = await http.put('/timetable/periods', { periods: nextPeriods });
    periods.setData(saved);
    triggerToast(message);
    entries.reload();
  };

  const handleAddPeriod = (newPeriod) =>
    savePeriods([...(periods.data || []), newPeriod], `New period row "${newPeriod.label}" added.`);

  const handleDeletePeriod = (periodId) =>
    savePeriods((periods.data || []).filter((p) => p.id !== periodId), 'Period row removed.');

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Weekly Timetable
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                View and manage class schedules. Click a cell to add or change a lesson.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-auto">
              <select
                value={selectedClass}
                onChange={(e) => {
                  setChosenClass(e.target.value);
                  setSelectedSubject(null);
                }}
                disabled={classOptions.length === 0}
                className="px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                {classOptions.length === 0 && <option value="">No classes</option>}
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsManagePeriodsOpen(true)}
                disabled={!periods.data}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Manage Periods</span>
              </button>
            </div>
          </div>

          <AsyncState state={[classes, periods]} loadingText="Loading timetable…">
            {([, periodList]) =>
              !selectedClass ? (
                <EmptyMessage text="No classes exist yet. Create a class first." />
              ) : periodList.length === 0 ? (
                <EmptyMessage text="No periods are defined. Use Manage Periods to add the school day's periods." />
              ) : (
                <AsyncState state={entries} loadingText="Loading timetable…">
                  {(entryList) => (
                    <>
                      <SubjectLegend
                        subjects={subjectsInUse}
                        selectedSubject={selectedSubject}
                        onSelectSubject={setSelectedSubject}
                      />
                      <TimetableGrid
                        periods={periodList}
                        entries={entryList}
                        selectedSubject={selectedSubject}
                        onCellClick={handleCellClick}
                      />
                    </>
                  )}
                </AsyncState>
              )
            }
          </AsyncState>
        </main>
      </div>

      <EditTimetableEntryModal
        isOpen={editModalState.isOpen}
        cellData={editModalState.cellData}
        subjects={meta.data?.subjects || []}
        teachers={teachers.data || []}
        optionsError={teachers.error || meta.error}
        onClose={closeEditModal}
        onSave={handleSaveEntry}
        onClear={handleClearEntry}
      />

      <ManagePeriodsModal
        isOpen={isManagePeriodsOpen}
        periods={periods.data || []}
        onClose={() => setIsManagePeriodsOpen(false)}
        onAddPeriod={handleAddPeriod}
        onDeletePeriod={handleDeletePeriod}
      />
    </div>
  );
};

export default TimetablePage;
