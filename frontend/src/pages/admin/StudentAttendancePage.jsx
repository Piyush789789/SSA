import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CalendarCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AttendanceStatusBadge } from '@/components/attendance/AttendanceStatusBadge';
import { AsyncState, EmptyMessage, ErrorMessage, LoadingMessage } from '@/components/common/AsyncState';
import { NotFoundCard } from '@/components/students/NotFoundCard';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { addDays, formatDate, initialsOf, parseIsoDate, todayIso, weekdayName } from '@/utils';
import { formatRate, groupBy, summarizeRecords } from '@/components/attendance/attendanceMath';
import { useI18n } from '@/i18n/translate';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CELL_STYLES = {
  present: 'bg-emerald-500 text-white',
  late: 'bg-amber-400 text-white',
  absent: 'bg-rose-500 text-white',
  leave: 'bg-sky-400 text-white',
  holiday: 'bg-slate-300 text-slate-700',
};

const GRID_DAYS = 30;

export const StudentAttendancePage = () => {
  const { tx } = useI18n();
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [activeSidebarId, setActiveSidebarId] = useState('attendance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [today] = useState(todayIso);

  const studentState = useApi(`/students/${encodeURIComponent(studentId)}`);
  const student = studentState.data;
  const records = useApi(student ? withQuery('/attendance', { studentId: student.id }) : null);
  const stats = useApi(student ? `/attendance/students/${encodeURIComponent(student.id)}/stats` : null);

  const sortedRecords = useMemo(
    () => [...(records.data || [])].sort((a, b) => b.date.localeCompare(a.date)),
    [records.data],
  );

  const byDate = useMemo(() => new Map(sortedRecords.map((r) => [r.date, r])), [sortedRecords]);

  const lastDays = useMemo(
    () =>
      Array.from({ length: GRID_DAYS }, (_, i) => {
        const date = addDays(today, i - (GRID_DAYS - 1));
        return { date, record: byDate.get(date), isSunday: parseIsoDate(date).getDay() === 0 };
      }),
    [byDate, today],
  );

  const monthlyLogs = useMemo(() => {
    const byMonth = groupBy(sortedRecords, (r) => r.date.slice(0, 7));
    return [...byMonth.entries()].map(([month, list]) => {
      const s = summarizeRecords(list);
      return {
        month: `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`,
        key: month,
        ...s,
      };
    });
  }, [sortedRecords]);

  const isNotFound = studentState.error?.status === 404;

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto pb-16">
          <button
            type="button"
            onClick={() => navigate('/admin/attendance')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#FF6B2C] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {tx('Back to Attendance Dashboard')}
          </button>

          {isNotFound ? (
            <NotFoundCard
              title="Student not found"
              message={`No student with ID "${studentId}" exists.`}
              backLabel="Back to Attendance"
              onBack={() => navigate('/admin/attendance')}
            />
          ) : studentState.error && !student ? (
            <ErrorMessage error={studentState.error} onRetry={studentState.reload} />
          ) : !student ? (
            <LoadingMessage text="Loading student…" />
          ) : (
            <>
              {/* Student Profile Card Banner */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#FF6B2C] font-black text-lg flex items-center justify-center shrink-0 border border-orange-200">
                    {initialsOf(student.name)}
                  </div>
                  <div>
                    <h1
                      onClick={() => navigate(`/admin/students/${student.id}`)}
                      className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight cursor-pointer hover:text-[#FF6B2C]"
                    >
                      {student.name}
                    </h1>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      ID: <span className="text-slate-700 font-bold">{student.id}</span> • Class:{' '}
                      <span className="text-slate-700 font-bold">{student.className}</span> • Roll No:{' '}
                      <span className="text-slate-700 font-bold">{student.rollNumber ?? '—'}</span>
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-black text-sm">
                  <CalendarCheck className="w-4 h-4" />
                  <span>Overall Rate: {stats.data ? formatRate(stats.data.rate) : '…'}</span>
                </div>
              </div>

              {/* Student Stats Summary Cards */}
              <AsyncState state={stats}>
                {(s) => (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Present Days</p>
                        <h3 className="text-xl font-extrabold text-emerald-600">{s.present} Days</h3>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Absent Days</p>
                        <h3 className="text-xl font-extrabold text-rose-600">{s.absent} Days</h3>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Late Days</p>
                        <h3 className="text-xl font-extrabold text-amber-600">{s.late} Days</h3>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Working Days</p>
                        <h3 className="text-xl font-extrabold text-indigo-600">{s.workingDays} Days</h3>
                      </div>
                    </div>
                  </div>
                )}
              </AsyncState>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
                {['overview', 'daily', 'monthly'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 capitalize transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'border-b-2 border-[#FF6B2C] text-[#FF6B2C]'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {tab} Attendance
                  </button>
                ))}
              </div>

              <AsyncState state={records} loadingText="Loading attendance…">
                {() =>
                  activeTab === 'overview' ? (
                    /* Last 30 days, one cell per day */
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Last {GRID_DAYS} Days ({formatDate(lastDays[0].date)} – {formatDate(today)})
                      </h3>
                      <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-15 gap-2">
                        {lastDays.map(({ date, record, isSunday }) => (
                          <div
                            key={date}
                            title={`${formatDate(date)} (${weekdayName(date)}): ${record ? record.status : isSunday ? 'Sunday' : 'not marked'}`}
                            className={`rounded-xl p-2 text-center border ${
                              record ? `${CELL_STYLES[record.status] || 'bg-slate-100'} border-transparent` : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <div className="text-[10px] font-semibold opacity-80">{weekdayName(date).slice(0, 3)}</div>
                            <div className="text-sm font-black">{parseIsoDate(date).getDate()}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500 pt-2">
                        {Object.entries(CELL_STYLES).map(([status, cls]) => (
                          <span key={status} className="inline-flex items-center gap-1.5 capitalize">
                            <span className={`w-3 h-3 rounded ${cls}`} /> {status}
                          </span>
                        ))}
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-slate-50 border border-slate-200" /> Not marked
                        </span>
                      </div>
                    </div>
                  ) : activeTab === 'monthly' ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Month-by-Month Attendance Breakdown
                      </h3>
                      {monthlyLogs.length === 0 ? (
                        <EmptyMessage text="No attendance has been recorded for this student yet." />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                <th className="py-2.5 px-3">Month</th>
                                <th className="py-2.5 px-3">Present</th>
                                <th className="py-2.5 px-3">Absent</th>
                                <th className="py-2.5 px-3">Late</th>
                                <th className="py-2.5 px-3">Leave</th>
                                <th className="py-2.5 px-3">Working Days</th>
                                <th className="py-2.5 px-3">Attendance Rate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold">
                              {monthlyLogs.map((m) => (
                                <tr key={m.key} className="hover:bg-slate-50">
                                  <td className="py-3 px-3 font-bold text-slate-900">{m.month}</td>
                                  <td className="py-3 px-3 text-emerald-600 font-bold">{m.present}</td>
                                  <td className="py-3 px-3 text-rose-600 font-bold">{m.absent}</td>
                                  <td className="py-3 px-3 text-amber-600 font-bold">{m.late}</td>
                                  <td className="py-3 px-3 text-sky-600 font-bold">{m.leave}</td>
                                  <td className="py-3 px-3 text-slate-600">{m.workingDays}</td>
                                  <td className="py-3 px-3 text-[#FF6B2C] font-extrabold">{formatRate(m.rate)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Daily Attendance History</h3>
                      {sortedRecords.length === 0 ? (
                        <EmptyMessage text="No attendance has been recorded for this student yet." />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Day</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Check-in Time</th>
                                <th className="py-2.5 px-3">Remarks</th>
                                <th className="py-2.5 px-3">Marked By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold">
                              {sortedRecords.map((log) => (
                                <tr key={log.id || log.date} className="hover:bg-slate-50">
                                  <td className="py-3 px-3 font-bold text-slate-900">{formatDate(log.date)}</td>
                                  <td className="py-3 px-3 text-slate-600">{weekdayName(log.date)}</td>
                                  <td className="py-3 px-3">
                                    <AttendanceStatusBadge status={log.status} />
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">{log.checkInTime || '—'}</td>
                                  <td className="py-3 px-3 text-slate-400 font-normal">{log.remarks || '—'}</td>
                                  <td className="py-3 px-3 text-slate-400 font-normal">{log.markedBy || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                }
              </AsyncState>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
