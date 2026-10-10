import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TeacherCard } from '@/components/teachers/TeacherCard';
import { TeacherSearch } from '@/components/teachers/TeacherSearch';
import { TeacherFormModal } from '@/components/teachers/TeacherFormModal';
import { DeleteTeacherDialog } from '@/components/teachers/DeleteTeacherDialog';
import { AsyncState } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';

export const TeachersPage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('teachers');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const teachers = useApi('/teachers');
  const meta = useApi('/meta');
  const classes = useApi('/classes');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState(null);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredTeachers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return (teachers.data || []).filter((t) => {
      if (!query) return true;
      return (
        t.name.toLowerCase().includes(query) ||
        (t.email || '').toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        (t.subjects || []).some((s) => s.toLowerCase().includes(query))
      );
    });
  }, [teachers.data, searchTerm]);

  const handleOpenAddModal = () => {
    setTeacherToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (teacher) => {
    setTeacherToEdit(teacher);
    setIsFormModalOpen(true);
  };

  /** Throws the ApiError so the form can show it. */
  const handleSaveTeacher = async (teacherData) => {
    if (teacherToEdit) {
      await http.put(`/teachers/${encodeURIComponent(teacherToEdit.id)}`, { ...teacherData, id: teacherToEdit.id });
      triggerToast('Teacher updated successfully.');
    } else {
      await http.post('/teachers', teacherData);
      triggerToast('Teacher added successfully.');
    }
    setIsFormModalOpen(false);
    teachers.reload();
  };

  const handleConfirmDelete = async (teacher) => {
    await http.delete(`/teachers/${encodeURIComponent(teacher.id)}`);
    setTeacherToDelete(null);
    triggerToast('Teacher deleted successfully.');
    teachers.reload();
  };

  const count = teachers.data?.length;

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Teachers
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                {count === undefined ? 'Loading teaching staff…' : `${count} teaching staff ${count === 1 ? 'member' : 'members'}.`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Teacher</span>
            </button>
          </div>

          <TeacherSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

          <AsyncState state={teachers} loadingText="Loading teachers…">
            {() =>
              filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeachers.map((teacher) => (
                    <TeacherCard
                      key={teacher.id}
                      teacher={teacher}
                      onEdit={handleOpenEditModal}
                      onDelete={setTeacherToDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-sm">
                  {searchTerm ? 'No teachers found matching your search.' : 'No teachers have been added yet.'}
                </div>
              )
            }
          </AsyncState>
        </main>
      </div>

      <TeacherFormModal
        isOpen={isFormModalOpen}
        teacherToEdit={teacherToEdit}
        subjectOptions={meta.data?.subjects || []}
        classOptions={(classes.data || []).map((c) => c.id).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))}
        optionsError={meta.error || classes.error}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveTeacher}
      />

      <DeleteTeacherDialog
        isOpen={Boolean(teacherToDelete)}
        teacher={teacherToDelete}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TeachersPage;
