import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CalendarCheck,
  FileCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar as CalendarIcon,
  AlertTriangle,
  TrendingUp,
  Megaphone,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { addDays, formatDate, formatDateTime, initialsOf, todayIso, weekdayName } from '@/utils';

/** Attendance rate as the backend computes it: (present + late) / (present + absent + late + leave). */
const rateOf = ({ present, absent, late, leave }) => {
  const working = present + absent + late + leave;
  return working === 0 ? null : Math.round(((present + late) * 1000) / working) / 10;
};

const showRate = (rate) => (rate == null ? '—' : `${rate}%`);

const nowHHmm = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const dashboard = useApi('/dashboard');
  const periods = useApi('/timetable/periods');

  const assignedClasses = useMemo(() => currentUser?.assignedClasses ?? [], [currentUser]);
  const teacherName = currentUser?.name ?? '';
  const today = dashboard.data?.date ?? todayIso();

  // 'ALL' or one class, e.g. '5-B'
  const [selectedClass, setSelectedClass] = useState('ALL');
  const inScope = (className) => (selectedClass === 'ALL' ? assignedClasses.includes(className) : className === selectedClass);

  // Last 7 days of attendance for the trend chart.
  const weekFrom = addDays(today, -6);
  const weekAttendance = useApi(
    withQuery('/attendance', { from: weekFrom, to: today, className: selectedClass === 'ALL' ? undefined : selectedClass }),
  );

  const data = dashboard.data;

  const classSummaries = useMemo(
    () => (data?.classes ?? []).filter((c) => (selectedClass === 'ALL' ? true : c.className === selectedClass)),
    [data, selectedClass],
  );

  const todayTotals = useMemo(() => {
    const totals = { totalStudents: 0, present: 0, absent: 0, late: 0, leave: 0, notMarked: 0 };
    classSummaries.forEach((c) => {
      Object.keys(totals).forEach((key) => {
        totals[key] += c[key] ?? 0;
      });
    });
    return { ...totals, rate: classSummaries.length === 1 ? classSummaries[0].rate : rateOf(totals) };
  }, [classSummaries]);

  const trend = useMemo(() => {
    const byDate = {};
    (weekAttendance.data ?? [])
      .filter((r) => assignedClasses.includes(r.className))
      .forEach((r) => {
        byDate[r.date] ??= { present: 0, absent: 0, late: 0, leave: 0 };
        if (byDate[r.date][r.status] !== undefined) byDate[r.date][r.status] += 1;
      });
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = addDays(today, -i);
      const counts = byDate[date];
      const rate = counts ? rateOf(counts) : null;
      if (rate != null) days.push({ date, rate });
    }
    return days;
  }, [weekAttendance.data, assignedClasses, today]);

  const trendAverage = trend.length ? Math.round((trend.reduce((sum, d) => sum + d.rate, 0) / trend.length) * 10) / 10 : null;

  const periodsById = useMemo(() => {
    const map = {};
    (periods.data ?? []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [periods.data]);

  const now = nowHHmm();
  const todaySchedule = (data?.todaysTimetable ?? [])
      .filter((entry) => inScope(entry.className))
      .map((entry) => {
        const period = periodsById[entry.periodId];
        let status = '';
        if (period) {
          if (now >= period.endTime) status = 'Completed';
          else if (now >= period.startTime) status = 'NOW';
          else status = 'Upcoming';
        }
        return {
          ...entry,
          time: period ? `${period.startTime} – ${period.endTime}` : entry.periodId,
          label: period?.label,
          status,
        };
      });

  const upcomingExams = (data?.upcomingExams ?? []).filter((p) => inScope(p.className));
  const pendingMarks = (data?.pendingMarksEntry ?? []).filter((p) => inScope(p.className));
  const homeworkDue = (data?.homeworkDue ?? []).filter((h) => inScope(h.className));
  const lowAttendance = (data?.lowAttendance ?? []).filter((s) => inScope(s.className));
  const recentNotices = data?.recentNotices ?? [];

  const attendanceLinkClass = selectedClass === 'ALL' ? assignedClasses[0] : selectedClass;
  const attendanceLink = attendanceLinkClass
    ? `/teacher/attendance?class=${encodeURIComponent(attendanceLinkClass)}`
    : '/teacher/attendance';

  // Trend chart geometry: y = 180 - rate * 1.6 (0% at the bottom line, 100% at the top line).
  const chartPoints = trend.map((d, i) => ({
    ...d,
    x: trend.length === 1 ? 265 : 50 + (430 * i) / (trend.length - 1),
    y: 180 - d.rate * 1.6,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Welcome Header & Class Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B2C] mb-1">
            <CalendarIcon className="w-4 h-4 stroke-[2]" />
            <span>
              {weekdayName(today)}, {formatDate(today)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Teacher Dashboard</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            {greeting()}, {teacherName.split(' ')[0]} • Your classes, attendance, and assignments overview.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shrink-0">
          <label className="text-xs font-bold text-slate-500 pl-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#FF6B2C]" />
            <span>Class:</span>
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 px-3.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 shadow-xs cursor-pointer"
          >
            <option value="ALL">All Classes{assignedClasses.length ? ` (${assignedClasses.join(' & ')})` : ''}</option>
            {assignedClasses.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AsyncState state={dashboard} loadingText="Loading your dashboard…">
        {() => (
          <>
            {/* TOP 4 SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/15 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">My Classes</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <BookOpen className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
                    {selectedClass === 'ALL' ? assignedClasses.length : 1}
                  </h3>
                  <p className="text-xs text-indigo-100 font-semibold mt-1.5 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>
                      {selectedClass === 'ALL'
                        ? assignedClasses.length
                          ? `${assignedClasses.join(', ')} assigned`
                          : 'No classes assigned'
                        : `Class ${selectedClass} selected`}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FF6B2C] via-orange-500 to-amber-500 text-white p-6 rounded-3xl shadow-lg shadow-orange-500/15 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">Total Students</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <Users className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{todayTotals.totalStudents}</h3>
                  <p className="text-xs text-orange-100 font-semibold mt-1.5 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>
                      {selectedClass === 'ALL'
                        ? `Across ${classSummaries.length} assigned ${classSummaries.length === 1 ? 'class' : 'classes'}`
                        : `Enrolled in ${selectedClass}`}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-teal-500/15 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">Today's Attendance</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{showRate(todayTotals.rate)}</h3>
                  <p className="text-xs text-teal-100 font-semibold mt-1.5 flex items-center gap-1">
                    <span>
                      {todayTotals.present} Present • {todayTotals.absent} Absent
                      {todayTotals.notMarked ? ` • ${todayTotals.notMarked} not marked` : ''}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-orange-500 text-white p-6 rounded-3xl shadow-lg shadow-rose-500/15 flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-100 uppercase tracking-wider">Homework Due</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <FileCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{homeworkDue.length}</h3>
                  <p className="text-xs text-rose-100 font-semibold mt-1.5 flex items-center gap-1">
                    <span>
                      {pendingMarks.length} {pendingMarks.length === 1 ? 'paper' : 'papers'} awaiting marks
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION: WEEKLY ATTENDANCE TREND & PENDING MARKS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FF6B2C]" />
                    <h2 className="text-base font-bold text-slate-900">
                      Attendance — Last 7 Days — {selectedClass === 'ALL' ? 'All Classes' : `Class ${selectedClass}`}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    Avg: {showRate(trendAverage)}
                  </span>
                </div>

                <AsyncState state={weekAttendance} loadingText="Loading attendance…">
                  {() =>
                    chartPoints.length === 0 ? (
                      <EmptyMessage text="No attendance has been marked in the last 7 days." />
                    ) : (
                      <div className="h-56 w-full pt-4 relative flex flex-col justify-between">
                        <svg viewBox="0 0 500 190" className="w-full h-44 overflow-visible">
                          {[20, 60, 100, 140, 180].map((y) => (
                            <line key={y} x1="40" y1={y} x2="490" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          ))}
                          <text x="12" y="24" fontSize="10" fill="#94a3b8" fontWeight="600">100</text>
                          <text x="18" y="64" fontSize="10" fill="#94a3b8" fontWeight="600">75</text>
                          <text x="18" y="104" fontSize="10" fill="#94a3b8" fontWeight="600">50</text>
                          <text x="18" y="144" fontSize="10" fill="#94a3b8" fontWeight="600">25</text>
                          <text x="24" y="184" fontSize="10" fill="#94a3b8" fontWeight="600">0</text>

                          {chartPoints.length > 1 && (
                            <polyline
                              points={chartPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill="none"
                              stroke="#FF6B2C"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          {chartPoints.map((p) => (
                            <circle key={p.date} cx={p.x} cy={p.y} r="5.5" fill="#FF6B2C" stroke="#ffffff" strokeWidth="2.5">
                              <title>{`${formatDate(p.date)}: ${p.rate}%`}</title>
                            </circle>
                          ))}
                        </svg>

                        <div className="flex justify-between pl-10 pr-2 text-[11px] font-bold text-slate-500">
                          {chartPoints.map((p) => (
                            <span key={p.date}>
                              {weekdayName(p.date).slice(0, 3)} ({p.rate}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  }
                </AsyncState>
              </div>

              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Marks Entry Progress</h2>
                  <span className="text-xs font-bold text-slate-500">{pendingMarks.length} pending</span>
                </div>

                {pendingMarks.length === 0 ? (
                  <EmptyMessage text="All papers held so far have marks entered." />
                ) : (
                  <div className="space-y-3.5 pt-2">
                    {pendingMarks.map((paper) => {
                      const pct = paper.totalStudents ? Math.round((paper.entered / paper.totalStudents) * 100) : 0;
                      return (
                        <button
                          key={paper.scheduleId}
                          type="button"
                          onClick={() => navigate(`/teacher/exams/${encodeURIComponent(paper.scheduleId)}/marks`)}
                          className="w-full text-left space-y-1.5 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700 group-hover:text-[#FF6B2C]">
                              {paper.subject} • Class {paper.className}
                              <span className="text-slate-400 font-semibold"> — {paper.examName}</span>
                            </span>
                            <span className="text-[#FF6B2C] shrink-0">
                              {paper.entered}/{paper.totalStudents}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 to-[#FF6B2C]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* TODAY'S CLASS SCHEDULE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FF6B2C]" />
                    <span>Today's Schedule — {weekdayName(today)}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Periods scheduled today for {teacherName} {selectedClass !== 'ALL' && `(Class ${selectedClass})`}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/teacher/timetable')}
                  className="text-xs font-bold text-[#FF6B2C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Timetable</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {todaySchedule.length === 0 ? (
                <EmptyMessage text="No periods scheduled for you today." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {todaySchedule.map((item) => {
                    const isNow = item.status === 'NOW';
                    return (
                      <div
                        key={item.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          isNow
                            ? 'bg-[#FFF5F0] border-[#FF6B2C] ring-2 ring-[#FF6B2C]/20 shadow-md'
                            : 'bg-slate-50/70 border-slate-200/70 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 bg-white border border-slate-200/80 rounded-md font-bold text-[11px] text-slate-800">
                            {item.time}
                          </span>
                          {isNow ? (
                            <span className="px-2.5 py-0.5 bg-[#FF6B2C] text-white rounded-md text-[10px] font-black uppercase tracking-wider animate-pulse">
                              NOW
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">{item.status}</span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">{item.subject}</h4>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                            <span className="text-slate-800 font-bold">Class {item.className}</span>
                            {item.room && (
                              <>
                                <span>•</span>
                                <span>{item.room}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CLASS ATTENDANCE & ATTENTION SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Class Attendance Overview</h2>
                    <p className="text-xs text-slate-500">Attendance status for today</p>
                  </div>

                  <button
                    onClick={() => navigate(attendanceLink)}
                    className="px-4 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    Mark Attendance
                  </button>
                </div>

                {classSummaries.length === 0 ? (
                  <EmptyMessage text="No classes assigned." />
                ) : (
                  <div className="space-y-4">
                    {classSummaries.map((item) => (
                      <div key={item.className} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">Class {item.className}</h4>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {item.totalStudents} Students enrolled
                              {item.notMarked ? ` • ${item.notMarked} not marked yet` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black text-slate-900">{showRate(item.rate)}</span>
                            <span className="block text-[10px] text-emerald-600 font-bold">Attendance</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-emerald-50 border border-emerald-200/60 p-2 rounded-xl text-emerald-800 font-bold">
                            <span className="block text-sm font-black">{item.present}</span>
                            <span className="text-[10px]">Present</span>
                          </div>
                          <div className="bg-rose-50 border border-rose-200/60 p-2 rounded-xl text-rose-800 font-bold">
                            <span className="block text-sm font-black">{item.absent}</span>
                            <span className="text-[10px]">Absent</span>
                          </div>
                          <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-xl text-amber-800 font-bold">
                            <span className="block text-sm font-black">{item.late}</span>
                            <span className="text-[10px]">Late</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Students Needing Attention</span>
                    </h2>
                    <p className="text-xs text-slate-500">Students below the school's attendance threshold</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-xl text-xs">
                    {lowAttendance.length} Alerts
                  </span>
                </div>

                {lowAttendance.length === 0 ? (
                  <EmptyMessage text="No students with low attendance." />
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                    {lowAttendance.map((st) => (
                      <div
                        key={st.studentId}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-200">
                            {initialsOf(st.name)}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{st.name}</h4>
                            <span className="text-[11px] font-semibold text-slate-400">
                              Class {st.className} • {st.studentId}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                          Low Attendance: {showRate(st.rate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* UPCOMING EXAMS & AT A GLANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Upcoming Tests & Exams</h2>
                    <p className="text-xs text-slate-500">Papers of your subjects in your classes</p>
                  </div>
                  <button onClick={() => navigate('/teacher/exams')} className="text-xs font-bold text-[#FF6B2C] hover:underline">
                    View All
                  </button>
                </div>

                {upcomingExams.length === 0 ? (
                  <EmptyMessage text="No upcoming papers." />
                ) : (
                  <div className="space-y-3">
                    {upcomingExams.map((exam) => (
                      <div
                        key={exam.scheduleId}
                        className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-200 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-orange-100 text-[#FF6B2C] rounded-md text-[10px] font-black">
                              Class {exam.className}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">
                              {exam.subject} — {exam.examName}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Date: <strong>{formatDate(exam.date)}</strong>
                            {exam.startTime ? ` • ${exam.startTime}` : ''} • Max Marks: <strong>{exam.maxMarks}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => navigate(`/teacher/exams/${encodeURIComponent(exam.scheduleId)}/marks`)}
                            className="px-3.5 py-1.5 bg-[#FFF5F0] hover:bg-[#FF6B2C] text-[#FF6B2C] hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Marks Sheet
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">At a Glance</h2>
                  <p className="text-xs text-slate-500">Things that need your attention</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => navigate('/teacher/exams')}
                    className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-100 transition-colors"
                  >
                    <span className="text-xs font-bold text-amber-800">Pending Marks</span>
                    <h3 className="text-2xl font-black text-amber-900 mt-1">{pendingMarks.length}</h3>
                    <p className="text-[10px] text-amber-700 mt-0.5">Papers awaiting marks</p>
                  </div>

                  <div
                    onClick={() => navigate('/teacher/exams')}
                    className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-xs font-bold text-blue-800">Upcoming Papers</span>
                    <h3 className="text-2xl font-black text-blue-900 mt-1">{upcomingExams.length}</h3>
                    <p className="text-[10px] text-blue-700 mt-0.5">Next scheduled papers</p>
                  </div>

                  <div
                    onClick={() => navigate('/teacher/homework')}
                    className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    <span className="text-xs font-bold text-purple-800">Homework Due</span>
                    <h3 className="text-2xl font-black text-purple-900 mt-1">{homeworkDue.length}</h3>
                    <p className="text-[10px] text-purple-700 mt-0.5">Due today or later</p>
                  </div>

                  <div
                    onClick={() => navigate(attendanceLink)}
                    className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl cursor-pointer hover:bg-emerald-100 transition-colors"
                  >
                    <span className="text-xs font-bold text-emerald-800">Not Marked Today</span>
                    <h3 className="text-2xl font-black text-emerald-900 mt-1">{todayTotals.notMarked}</h3>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Students without attendance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* HOMEWORK DUE & NOTICES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Active Homework</h2>
                    <p className="text-xs text-slate-500">Your homework that is due today or later</p>
                  </div>
                  <button onClick={() => navigate('/teacher/homework')} className="text-xs font-bold text-[#FF6B2C] hover:underline">
                    View All
                  </button>
                </div>

                {homeworkDue.length === 0 ? (
                  <EmptyMessage text="No homework due." />
                ) : (
                  <div className="space-y-3">
                    {homeworkDue.map((hw) => (
                      <div
                        key={hw.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3"
                      >
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-orange-100 text-[#FF6B2C] rounded font-bold text-[10px]">
                              Class {hw.className}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{hw.title}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Due: <strong>{formatDate(hw.dueDate)}</strong> • {hw.subject}
                          </p>
                        </div>

                        <button
                          onClick={() => navigate('/teacher/homework')}
                          className="p-2 text-slate-400 hover:text-[#FF6B2C] rounded-xl hover:bg-white transition-colors cursor-pointer shrink-0"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Recent Notices</h2>
                      <p className="text-xs text-slate-500">Latest announcements</p>
                    </div>
                    <button onClick={() => navigate('/teacher/notices')} className="text-xs font-bold text-[#FF6B2C] hover:underline">
                      View All
                    </button>
                  </div>

                  {recentNotices.length === 0 ? (
                    <EmptyMessage text="No notices yet." />
                  ) : (
                    <div className="space-y-3 text-xs">
                      {recentNotices.map((notice) => (
                        <div key={notice.id} className="flex items-start justify-between gap-3 py-1">
                          <div className="flex items-start gap-2.5">
                            <Megaphone className="w-4 h-4 text-[#FF6B2C] mt-0.5 shrink-0" />
                            <div>
                              <span className="text-slate-800 font-semibold">{notice.title}</span>
                              <p className="text-[10px] text-slate-400">{notice.authorName}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatDateTime(notice.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions Bar */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      ['Mark Attendance', attendanceLink],
                      ['Assign Homework', '/teacher/homework'],
                      ['Enter Marks', '/teacher/exams'],
                      ['View Timetable', '/teacher/timetable'],
                      ['Message Parents', '/teacher/communication'],
                    ].map(([label, route]) => (
                      <button
                        key={label}
                        onClick={() => navigate(route)}
                        className="p-3 bg-slate-50 hover:bg-[#FFF5F0] hover:text-[#FF6B2C] border border-slate-200/80 rounded-2xl text-left text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      onClick={() => navigate('/teacher/ai-assistant')}
                      className="p-3 bg-[#FFF5F0] border border-[#FF6B2C]/30 text-[#FF6B2C] rounded-2xl text-left text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Assistant</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </AsyncState>
    </div>
  );
};

export default TeacherDashboard;
