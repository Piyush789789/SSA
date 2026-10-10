import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Search } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/utils';
import { formatRate, groupBy } from '@/components/attendance/attendanceMath';
import { useI18n } from '@/i18n/translate';

export const ClassesListPage = () => {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const [activeSidebarId, setActiveSidebarId] = useState('classes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const classes = useApi('/classes');
  const todaySummary = useApi('/attendance/summary');
  const dues = useApi('/fees/dues');

  const summaryByClass = useMemo(
    () => new Map((todaySummary.data || []).map((s) => [s.className, s])),
    [todaySummary.data],
  );

  const feesByClass = useMemo(() => {
    const grouped = groupBy(dues.data || [], (d) => d.className);
    const totals = new Map();
    grouped.forEach((list, className) => {
      totals.set(className, {
        collected: list.reduce((sum, d) => sum + Number(d.paid || 0), 0),
        pending: list.reduce((sum, d) => sum + Number(d.pending || 0), 0),
      });
    });
    return totals;
  }, [dues.data]);

  const filteredClasses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (classes.data || [])
      .filter((c) => {
        if (!q) return true;
        return (
          c.id.toLowerCase().includes(q) ||
          (c.classTeacherName || '').toLowerCase().includes(q) ||
          String(c.section).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [classes.data, searchQuery]);

  const feeValue = (className, key) => {
    if (dues.error && !dues.data) return '—';
    if (!dues.data) return '…';
    return formatCurrency(feesByClass.get(className)?.[key] || 0);
  };

  const attendanceValue = (className) => {
    if (todaySummary.error && !todaySummary.data) return '—';
    if (!todaySummary.data) return '…';
    const s = summaryByClass.get(className);
    return s && s.rate !== null && s.rate !== undefined ? formatRate(s.rate) : 'Not marked';
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#FF6B2C] border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {tx('Class Overview & Management')}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                  {classes.data ? `Complete overview of all ${classes.data.length} school classes` : 'Loading classes…'}
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search class or teacher..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C]"
              />
            </div>
          </div>

          {/* Classes Cards Grid */}
          <AsyncState state={classes} loadingText="Loading classes…">
            {() =>
              filteredClasses.length === 0 ? (
                <EmptyMessage text={searchQuery ? 'No classes match your search.' : 'No classes have been created yet.'} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredClasses.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/admin/classes/${c.id}`)}
                      className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-[#FF6B2C]/40 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-[#FF6B2C] transition-colors">
                              Class {c.id}
                            </h3>
                            <p className="text-xs font-medium text-slate-400 truncate">
                              Teacher:{' '}
                              <span className="text-slate-700 font-semibold">{c.classTeacherName || 'Not assigned'}</span>
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-orange-50 text-[#FF6B2C] font-extrabold text-xs border border-orange-100 shrink-0">
                            Sec {c.section}
                          </span>
                        </div>

                        {/* Class Stats Summary */}
                        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Students</p>
                            <p className="font-extrabold text-slate-900 mt-0.5">{c.studentCount ?? 0}</p>
                          </div>

                          <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase">Today</p>
                            <p className="font-extrabold text-emerald-700 mt-0.5">{attendanceValue(c.id)}</p>
                          </div>

                          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Collected</p>
                            <p className="font-extrabold text-slate-900 mt-0.5">{feeValue(c.id, 'collected')}</p>
                          </div>

                          <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                            <p className="text-[10px] font-bold text-amber-700 uppercase">Pending</p>
                            <p className="font-extrabold text-amber-700 mt-0.5">{feeValue(c.id, 'pending')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#FF6B2C] hover:underline">
                        <span>View Class Dashboard</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </AsyncState>
        </main>
      </div>
    </div>
  );
};

export default ClassesListPage;
