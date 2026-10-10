import React, { useMemo, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TeacherList } from '@/components/roles/TeacherList';
import { TeacherPermissionPanel } from '@/components/roles/TeacherPermissionPanel';
import { UnsavedChangesModal } from '@/components/roles/UnsavedChangesModal';
import { SERVER_TEACHER_RULES } from '@/components/roles/permissionGroups';
import { AsyncState } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { useI18n } from '@/i18n/translate';

/**
 * Teachers come from GET /teachers. The backend has NO permissions API yet: every teacher gets the same
 * fixed role rules on the server, so the switches start from those rules and changes are kept only in
 * this browser tab (lost on reload) — the page says so clearly.
 */
export const RolesPermissionsPage = () => {
  const { tx } = useI18n();
  const [activeSidebarId, setActiveSidebarId] = useState('roles-permissions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const teachers = useApi('/teachers');

  // Per-teacher overrides made in this tab: { [teacherId]: permissions }.
  const [localPermissions, setLocalPermissions] = useState({});
  const [chosenTeacherId, setChosenTeacherId] = useState('');
  const [draft, setDraft] = useState(null); // edits of the selected teacher, null = unchanged
  const [searchQuery, setSearchQuery] = useState('');

  const [pendingTeacherId, setPendingTeacherId] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const teacherList = useMemo(() => teachers.data || [], [teachers.data]);
  const selectedTeacherId = chosenTeacherId || teacherList[0]?.id || '';
  const selectedTeacher = teacherList.find((t) => t.id === selectedTeacherId);
  const savedPermissions = localPermissions[selectedTeacherId] || SERVER_TEACHER_RULES;
  const currentPermissions = draft || savedPermissions;
  const isDirty = Boolean(draft);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return teacherList.filter(
      (t) => !q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q),
    );
  }, [teacherList, searchQuery]);

  const switchTo = (id) => {
    setChosenTeacherId(id);
    setDraft(null);
  };

  const handleSelectTeacher = (targetId) => {
    if (targetId === selectedTeacherId) return;
    if (isDirty) setPendingTeacherId(targetId);
    else switchTo(targetId);
  };

  const handleDiscardChanges = () => {
    if (pendingTeacherId) switchTo(pendingTeacherId);
    setPendingTeacherId(null);
  };

  const handleTogglePermission = (permissionId) =>
    setDraft((prev) => {
      const base = prev || savedPermissions;
      return { ...base, [permissionId]: !base[permissionId] };
    });

  const handleSavePermissions = () => {
    if (!selectedTeacherId) return;
    setLocalPermissions((prev) => ({ ...prev, [selectedTeacherId]: { ...currentPermissions } }));
    setDraft(null);
    showToast('Kept in this browser tab only — not saved to the server.');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
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
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#FF6B2C] border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {tx('Roles & Permissions')}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                Assign permissions to teachers
              </p>
            </div>
          </div>

          {/* Not-saved banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <p className="font-extrabold">Permissions are not saved to the server yet.</p>
              <p className="mt-0.5">
                The server currently applies the same fixed rules to every teacher (shown as the starting switches:
                teachers manage only their own classes and subjects, and cannot manage students, exams or fees). Changes
                made here stay in this browser tab only and are lost on reload — they do not change what a teacher can
                do.
              </p>
            </div>
          </div>

          <AsyncState state={teachers} loadingText="Loading teachers…">
            {() => (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 h-full">
                  <TeacherList
                    teachers={filteredTeachers}
                    selectedTeacherId={selectedTeacherId}
                    onSelectTeacher={handleSelectTeacher}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>

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
            )}
          </AsyncState>
        </main>
      </div>

      <UnsavedChangesModal
        isOpen={Boolean(pendingTeacherId)}
        onStay={() => setPendingTeacherId(null)}
        onDiscard={handleDiscardChanges}
      />
    </div>
  );
};

export default RolesPermissionsPage;
