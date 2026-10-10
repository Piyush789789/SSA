import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useI18n } from '@/i18n/translate';

/** Admin page frame: sidebar + header + page title (translated when known), same look as the other admin pages. */
export const AdminPageShell = ({ activeItemId, title, description, actions, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { tx } = useI18n();

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col">
      <Sidebar activeItemId={activeItemId} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{tx(title)}</h1>
              {description && <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminPageShell;
