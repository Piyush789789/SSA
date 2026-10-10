import React, { useState } from 'react';
import { Plus, CheckCircle2, Megaphone } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NoticeCard } from '@/components/notices/NoticeCard';
import { NoticeFormModal } from '@/components/notices/NoticeFormModal';
import { DeleteNoticeModal } from '@/components/notices/DeleteNoticeModal';
import { AsyncState } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http } from '@/api/http';
import { useI18n } from '@/i18n/translate';

export const NoticeBoardPage = () => {
  const { tx } = useI18n();
  const [activeSidebarId, setActiveSidebarId] = useState('notice-board');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // GET /notices is already sorted newest first.
  const notices = useApi('/notices');
  const meta = useApi('/meta');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState(null);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenCreateModal = () => {
    setNoticeToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (notice) => {
    setNoticeToEdit(notice);
    setIsFormModalOpen(true);
  };

  /** POST or PUT /notices; errors are shown by the form. */
  const handleSaveNotice = async (noticeData) => {
    if (noticeToEdit) {
      await http.put(`/notices/${encodeURIComponent(noticeToEdit.id)}`, noticeData);
      triggerToast('Notice updated successfully.');
    } else {
      await http.post('/notices', noticeData);
      triggerToast('Notice published successfully.');
    }
    setIsFormModalOpen(false);
    notices.reload();
  };

  const handleConfirmDelete = async (notice) => {
    await http.delete(`/notices/${encodeURIComponent(notice.id)}`);
    setNoticeToDelete(null);
    triggerToast('Notice deleted successfully.');
    notices.reload();
  };

  const count = notices.data?.length;

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {tx('Notice Board')}
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                {count === undefined
                  ? 'Loading notices…'
                  : `${count} ${count === 1 ? 'announcement' : 'announcements'} posted.`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{tx('New Notice')}</span>
            </button>
          </div>

          <AsyncState state={notices} loadingText="Loading notices…">
            {(list) =>
              list.length > 0 ? (
                <div className="space-y-4">
                  {list.map((notice) => (
                    <NoticeCard
                      key={notice.id}
                      notice={notice}
                      onEdit={handleOpenEditModal}
                      onDelete={setNoticeToDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center mx-auto">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">No notices posted yet.</h3>
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
              )
            }
          </AsyncState>
        </main>
      </div>

      <NoticeFormModal
        isOpen={isFormModalOpen}
        noticeToEdit={noticeToEdit}
        audiences={meta.data?.noticeAudiences}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveNotice}
      />

      <DeleteNoticeModal
        isOpen={Boolean(noticeToDelete)}
        notice={noticeToDelete}
        onClose={() => setNoticeToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default NoticeBoardPage;
