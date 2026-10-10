import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  SlidersHorizontal,
  CreditCard,
  FileText,
  Tag,
  RefreshCw,
  CheckCircle2,
  BadgeCheck,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';

import { FeeDashboardSection } from '@/components/fees/sections/FeeDashboardSection';
import { FeeStructureSection } from '@/components/fees/sections/FeeStructureSection';
import { CollectFeeSection } from '@/components/fees/sections/CollectFeeSection';
import { FeeReportsSection } from '@/components/fees/sections/FeeReportsSection';
import { FeeConcessionsSection } from '@/components/fees/sections/FeeConcessionsSection';
import { FeeDepositsSection } from '@/components/fees/sections/FeeDepositsSection';

const TABS = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Fee Structure', label: 'Fee Structure', icon: SlidersHorizontal },
  { id: 'Collect Fee', label: 'Collect Fee', icon: CreditCard },
  { id: 'Deposits', label: 'Deposits to Verify', icon: BadgeCheck },
  { id: 'Reports', label: 'Reports', icon: FileText },
  { id: 'Concessions', label: 'Concessions', icon: Tag },
];

export const FeesPage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('fees');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Shared reference data; each section loads its own fee data from the API.
  const metaApi = useApi('/meta');
  const classesApi = useApi('/classes');
  const classIds = useMemo(() => (classesApi.data || []).map((c) => c.id), [classesApi.data]);

  // Bumping this remounts the active section, which reloads its data.
  const [refreshKey, setRefreshKey] = useState(0);

  // Student chosen on the dashboard / reports to collect fees from
  const [selectedStudentForCollection, setSelectedStudentForCollection] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    metaApi.reload();
    classesApi.reload();
  };

  const handleSelectStudentForCollection = (student) => {
    setSelectedStudentForCollection(student);
    setActiveTab('Collect Fee');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 animate-bounce print:hidden">
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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Fee Management</h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                Class-wise fee structure, collection & reports
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-2xl shadow-xs transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="bg-[#FFF5F0] p-1.5 rounded-3xl inline-flex flex-wrap gap-1.5 border border-orange-100 shadow-xs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#FF6B2C] shadow-md shadow-[#FF6B2C]/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 stroke-[2.2] ${isActive ? 'text-[#FF6B2C]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <AsyncState state={[metaApi, classesApi]} loadingText="Loading fee module…">
              {([meta]) => (
                <div key={refreshKey}>
                  {activeTab === 'Dashboard' && (
                    <FeeDashboardSection
                      classes={classIds}
                      onSelectStudentForCollection={handleSelectStudentForCollection}
                    />
                  )}

                  {activeTab === 'Fee Structure' && (
                    <FeeStructureSection classes={classIds} meta={meta} onToast={triggerToast} />
                  )}

                  {activeTab === 'Collect Fee' && (
                    <CollectFeeSection
                      classes={classIds}
                      meta={meta}
                      selectedStudent={selectedStudentForCollection}
                      onClearExternalStudent={() => setSelectedStudentForCollection(null)}
                      onToast={triggerToast}
                    />
                  )}

                  {activeTab === 'Deposits' && <FeeDepositsSection onToast={triggerToast} />}

                  {activeTab === 'Reports' && (
                    <FeeReportsSection
                      classes={classIds}
                      onSelectStudentForCollection={handleSelectStudentForCollection}
                    />
                  )}

                  {activeTab === 'Concessions' && (
                    <FeeConcessionsSection classes={classIds} meta={meta} onToast={triggerToast} />
                  )}
                </div>
              )}
            </AsyncState>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FeesPage;
