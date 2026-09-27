import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Megaphone } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { INITIAL_NOTICES } from '@/data/noticesData';

import { NoticeCard } from '@/components/notices/NoticeCard';
import { NoticeFormModal } from '@/components/notices/NoticeFormModal';
import { DeleteNoticeModal } from '@/components/notices/DeleteNoticeModal';

export const NoticeBoardPage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('notice-board');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notices State
  const [notices, setNotices] = useState(INITIAL_NOTICES);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Sort notices by createdAt descending (newest first)
  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notices]);

  // Open Create Notice Modal
  const handleOpenCreateModal = () => {
    setNoticeToEdit(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Notice Modal
  const handleOpenEditModal = (notice) => {
    setNoticeToEdit(notice);
    setIsFormModalOpen(true);
  };

  // Save Notice (Publish new or Update existing)
  const handleSaveNotice = (noticeData) => {
    const todayStr = new Date().toISOString().split('T')[0];

    if (noticeData.id) {
      // Update existing notice
      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeData.id
            ? { ...n, ...noticeData, updatedAt: todayStr }
            : n
        )
      );
      triggerToast('Notice updated successfully.');
    } else {
      // Create new notice
      const newNotice = {
        ...noticeData,
        id: `notice-${Date.now()}`,
        createdAt: todayStr,
        updatedAt: todayStr,
      };
      setNotices((prev) => [newNotice, ...prev]);
      triggerToast('Notice published successfully.');
    }

    setIsFormModalOpen(false);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (notice) => {
    setNoticeToDelete(notice);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Notice
  const handleConfirmDelete = (noticeId) => {
    setNotices((prev) => prev.filter((n) => n.id !== noticeId));
    setIsDeleteModalOpen(false);
    setNoticeToDelete(null);
    triggerToast('Notice deleted successfully.');
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

        {/* Notice Board Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto pb-16">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Notice Board
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                {notices.length} {notices.length === 1 ? 'announcement' : 'announcements'} posted.
              </p>
            </div>

            {/* New Notice Action Button */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Notice</span>
            </button>
          </div>

          {/* Notices Stack List */}
          {sortedNotices.length > 0 ? (
            <div className="space-y-4">
              {sortedNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center mx-auto">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  No notices posted yet.
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click below to publish the first announcement for the school.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Notice</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Form Modal */}
      <NoticeFormModal
        isOpen={isFormModalOpen}
        noticeToEdit={noticeToEdit}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveNotice}
      />

      {/* Delete Confirmation Modal */}
      <DeleteNoticeModal
        isOpen={isDeleteModalOpen}
        notice={noticeToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default NoticeBoardPage;
