import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { INITIAL_TEACHERS } from '@/data/teachersPermissionsData';
import { TeacherList } from '@/components/roles/TeacherList';
import { TeacherPermissionPanel } from '@/components/roles/TeacherPermissionPanel';
import { UnsavedChangesModal } from '@/components/roles/UnsavedChangesModal';

export const RolesPermissionsPage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('roles-permissions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    INITIAL_TEACHERS[0]?.id || ''
  );

  // Form / Permission State for selected teacher
  const [currentPermissions, setCurrentPermissions] = useState(
    () => ({ ...(INITIAL_TEACHERS[0]?.permissions || {}) })
  );

  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Unsaved changes confirmation modal state
  const [pendingTeacherId, setPendingTeacherId] = useState(null);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '' });

  const showSuccessToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  // Filter teachers by search query
  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  });

  // Handle selecting a teacher from the left panel
  const handleSelectTeacher = (targetId) => {
    if (targetId === selectedTeacherId) return;

    if (isDirty) {
      setPendingTeacherId(targetId);
      setIsUnsavedModalOpen(true);
    } else {
      const targetTeacher = teachers.find((t) => t.id === targetId);
      setSelectedTeacherId(targetId);
      setCurrentPermissions({ ...(targetTeacher?.permissions || {}) });
      setIsDirty(false);
    }
  };

  // Discard changes when user clicks "Discard Changes" in modal
  const handleDiscardChanges = () => {
    if (pendingTeacherId) {
      const targetTeacher = teachers.find((t) => t.id === pendingTeacherId);
      setSelectedTeacherId(pendingTeacherId);
      setCurrentPermissions({ ...(targetTeacher?.permissions || {}) });
      setIsDirty(false);
      setPendingTeacherId(null);
    }
    setIsUnsavedModalOpen(false);
  };

  // Stay on current teacher when user clicks "Stay" in modal
  const handleStay = () => {
    setPendingTeacherId(null);
    setIsUnsavedModalOpen(false);
  };

  // Toggle single permission
  const handleTogglePermission = (permissionId) => {
    setCurrentPermissions((prev) => {
      const updated = { ...prev, [permissionId]: !prev[permissionId] };
      setIsDirty(true);
      return updated;
    });
  };

  // Save permission state for selected teacher
  const handleSavePermissions = () => {
    setTeachers((prevTeachers) =>
      prevTeachers.map((t) =>
        t.id === selectedTeacherId
          ? { ...t, permissions: { ...currentPermissions } }
          : t
      )
    );
    setIsDirty(false);
    showSuccessToast('Permissions updated successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          {/* Page Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#FF6B2C] border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Roles &amp; Permissions
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                Assign permissions to teachers
              </p>
            </div>
          </div>

          {/* Two-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Panel — Teachers (35% width approx -> col-span-4) */}
            <div className="lg:col-span-4 h-full">
              <TeacherList
                teachers={filteredTeachers}
                selectedTeacherId={selectedTeacherId}
                onSelectTeacher={handleSelectTeacher}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            {/* Right Panel — Selected Teacher's Permissions (65% width approx -> col-span-8) */}
            <div className="lg:col-span-8 h-full">
              <TeacherPermissionPanel
                teacher={selectedTeacher}
                currentPermissions={currentPermissions}
                onTogglePermission={handleTogglePermission}
                onSave={handleSavePermissions}
                isDirty={isDirty}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Unsaved Changes Prompt Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onStay={handleStay}
        onDiscard={handleDiscardChanges}
      />
    </div>
  );
};

export default RolesPermissionsPage;
