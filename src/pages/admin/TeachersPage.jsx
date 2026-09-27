import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TeacherCard } from '@/components/teachers/TeacherCard';
import { TeacherSearch } from '@/components/teachers/TeacherSearch';
import { TeacherFormModal } from '@/components/teachers/TeacherFormModal';
import { DeleteTeacherDialog } from '@/components/teachers/DeleteTeacherDialog';
import { initialTeachersData } from '@/data/teacherData';

export const TeachersPage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('teachers');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Teachers State
  const [teachers, setTeachers] = useState(initialTeachersData);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const query = searchTerm.toLowerCase().trim();
      if (!query) return true;
      return (
        t.name.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query)
      );
    });
  }, [teachers, searchTerm]);

  // Open Add Teacher Modal
  const handleOpenAddModal = () => {
    setTeacherToEdit(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Teacher Modal
  const handleOpenEditModal = (teacher) => {
    setTeacherToEdit(teacher);
    setIsFormModalOpen(true);
  };

  // Save Teacher (Add or Update)
  const handleSaveTeacher = (teacherData) => {
    if (teacherData.id) {
      // Update existing teacher
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherData.id ? { ...t, ...teacherData } : t))
      );
      triggerToast('Teacher updated successfully.');
    } else {
      // Add new teacher
      const newTeacher = {
        ...teacherData,
        id: Date.now(),
      };
      setTeachers((prev) => [newTeacher, ...prev]);
      triggerToast('Teacher added successfully.');
    }
    setIsFormModalOpen(false);
  };

  // Open Delete Confirmation Dialog
  const handleOpenDeleteDialog = (teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Teacher
  const handleConfirmDelete = (teacherId) => {
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    setIsDeleteModalOpen(false);
    setTeacherToDelete(null);
    triggerToast('Teacher deleted successfully.');
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
        {/* Header */}
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Teachers Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-12">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Teachers
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                22 teaching staff members.
              </p>
            </div>

            {/* Add Teacher Primary Action Button */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Teacher</span>
            </button>
          </div>

          {/* Search Bar */}
          <TeacherSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

          {/* Teachers Grid */}
          {filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteDialog}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-sm">
              No teachers found matching your search.
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Form Modal */}
      <TeacherFormModal
        isOpen={isFormModalOpen}
        teacherToEdit={teacherToEdit}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveTeacher}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTeacherDialog
        isOpen={isDeleteModalOpen}
        teacher={teacherToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TeachersPage;
