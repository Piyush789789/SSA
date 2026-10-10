import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  AlertCircle,
  FileText,
  Clock,
  Megaphone,
  CheckCircle2,
  Coffee,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate, formatCurrency, todayIso } from '@/utils';
import { useI18n } from '@/i18n/translate';
import { MyBusCard } from '@/components/transport/MyBusCard';

/** "HH:mm" of the current local time. */
const nowHHmm = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const { t, tx } = useI18n();
  const dashboard = useApi('/dashboard');

  const [showToast, setShowToast] = useState(true);
  const [clock, setClock] = useState(nowHHmm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Refresh the clock every minute so the "current period" highlight moves along.
  useEffect(() => {
    const interval = setInterval(() => setClock(nowHHmm()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {t('common.welcomeBack')}{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}!
            </h4>
            <p className="text-[11px] text-slate-500">Logged in as Student.</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {tx('Student Dashboard')}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Your academic progress and daily activities.
        </p>
      </div>

      {/* School bus (shown only when the student uses school transport) */}
      <MyBusCard studentId={currentUser?.studentId} hideWhenNone />

      <AsyncState state={dashboard} loadingText="Loading your dashboard…">
        {(data) => <DashboardBody data={data} className={currentUser?.className} clock={clock} />}
      </AsyncState>
    </div>
  );
};

const DashboardBody = ({ data, className, clock }) => {
  const navigate = useNavigate();
  const { tx } = useI18n();
  const attendance = data.attendance || {};
  const fees = data.fees || { total: 0, paid: 0, pending: 0, overdue: 0 };
  const upcomingExamsList = data.upcomingExams || [];
  const schedule = data.todaySchedule || [];
  const latestNotices = data.recentNotices || [];
  const homeworkDue = data.homeworkDue || [];
  const recentResults = data.recentResults || [];
  const isToday = data.date === todayIso();
  const attended = (attendance.present ?? 0) + (attendance.late ?? 0);

  return (
    <>
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Attendance */}
        <div
          onClick={() => navigate('/student/attendance')}
          className="bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-500 text-white p-6 rounded-3xl shadow-lg shadow-cyan-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-100 uppercase tracking-wider">{tx('Attendance')}</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
              {attendance.rate != null ? `${Math.round(attendance.rate)}%` : '—'}
            </h3>
            <p className="text-xs text-cyan-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>
                {attendance.workingDays
                  ? `${attended}P • ${attendance.absent ?? 0}A • ${attendance.leave ?? 0}L`
                  : 'No attendance marked yet'}
              </span>
            </p>
          </div>
        </div>

        {/* Total Fees */}
        <div
          onClick={() => navigate('/student/fees')}
          className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{tx('Total Fees')}</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{formatCurrency(fees.total)}</h3>
            <p className="text-xs text-emerald-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>{formatCurrency(fees.paid)} paid • View Ledger →</span>
            </p>
          </div>
        </div>

        {/* Fee Pending */}
        <div
          onClick={() => navigate('/student/fees')}
          className="bg-gradient-to-br from-orange-400 via-[#FF6B2C] to-amber-500 text-white p-6 rounded-3xl shadow-lg shadow-orange-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">{tx('Fee Pending')}</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{formatCurrency(fees.pending)}</h3>
            <p className="text-xs text-orange-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>
                {fees.overdue > 0
                  ? `${formatCurrency(fees.overdue)} overdue`
                  : fees.pending > 0
                    ? 'Pay soon'
                    : 'All clear'}{' '}
                • View Dues →
              </span>
            </p>
          </div>
        </div>

        {/* Upcoming Exams */}
        <div
          onClick={() => navigate('/student/exams')}
          className="bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">{tx('Upcoming Exams')}</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{upcomingExamsList.length}</h3>
            <p className="text-xs text-indigo-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>
                {upcomingExamsList[0] ? `Next: ${formatDate(upcomingExamsList[0].date)}` : 'None scheduled'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: TODAY'S TIMETABLE */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF6B2C]" />
              <span>{tx("Today's Timetable")}</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {className ? `Class ${className} • ` : ''}
              {formatDate(data.date)}
            </span>
          </div>

          {schedule.length === 0 ? (
            <EmptyMessage text="No classes scheduled today." />
          ) : (
            <div className="space-y-2.5">
              {schedule.map((slot) => {
                const isBreak = slot.type === 'break';
                const isCurrent = isToday && clock >= slot.startTime && clock < slot.endTime;
                return (
                  <div
                    key={slot.periodId}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                      isCurrent
                        ? 'bg-orange-50 border-[#FF6B2C] ring-2 ring-[#FF6B2C]/15'
                        : isBreak
                          ? 'bg-slate-100/60 border-dashed border-slate-200'
                          : 'bg-slate-50/60 hover:bg-orange-50/40 border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-orange-100/80 text-[#FF6B2C] font-black text-[10px] flex items-center justify-center shrink-0">
                        {isBreak ? <Coffee className="w-4 h-4" /> : slot.label.replace(/^Period\s*/i, 'P')}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          {isBreak ? slot.label : slot.subject || 'Free period'}
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#FF6B2C] text-white text-[9px] font-bold uppercase">
                              Now
                            </span>
                          )}
                        </h4>
                        {!isBreak && (
                          <p className="text-[11px] font-medium text-slate-400">
                            {[slot.teacherName, slot.room ? `Room ${slot.room}` : null].filter(Boolean).join(' • ') ||
                              slot.label}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-xs">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Homework due & recent results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{tx('Homework Due')}</h3>
                <button
                  onClick={() => navigate('/student/homework')}
                  className="text-[11px] font-bold text-[#FF6B2C] hover:underline"
                >
                  {tx('View all')}
                </button>
              </div>
              {homeworkDue.length === 0 ? (
                <p className="text-[11px] text-slate-400">No homework due.</p>
              ) : (
                homeworkDue.slice(0, 4).map((hw) => (
                  <div key={hw.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{hw.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {hw.subject} • Due {formatDate(hw.dueDate)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{tx('Recent Results')}</h3>
                <button
                  onClick={() => navigate('/student/report-card')}
                  className="text-[11px] font-bold text-[#FF6B2C] hover:underline"
                >
                  {tx('View all')}
                </button>
              </div>
              {recentResults.length === 0 ? (
                <p className="text-[11px] text-slate-400">No published results yet.</p>
              ) : (
                recentResults.map((r) => (
                  <div
                    key={`${r.examId}-${r.subject}`}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{r.subject}</p>
                      <p className="text-[10px] text-slate-400">{r.examName}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {r.absent ? 'Absent' : `${r.obtainedMarks ?? '—'}/${r.maxMarks}`}
                      {r.grade ? ` • ${r.grade}` : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: UPCOMING EXAMS & NOTICES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF6B2C]" />
                <span>{tx('Upcoming Exams')}</span>
              </h2>
              <button
                onClick={() => navigate('/student/exams')}
                className="text-xs font-bold text-[#FF6B2C] hover:underline"
              >
                {tx('View all')}
              </button>
            </div>

            <div className="space-y-3">
              {upcomingExamsList.length === 0 && <EmptyMessage text="No upcoming exams." />}
              {upcomingExamsList.map((exam) => (
                <div
                  key={exam.scheduleId}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between hover:border-orange-200 transition-all"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{exam.subject}</h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {exam.examName} • {exam.startTime}–{exam.endTime} • {exam.maxMarks} marks
                    </p>
                  </div>

                  <span className="px-3 py-1 bg-orange-100/80 text-[#FF6B2C] font-bold text-xs rounded-xl border border-orange-200/60 shrink-0">
                    {formatDate(exam.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#FF6B2C]" />
                <span>{tx('Notices')}</span>
              </h2>
              <button
                onClick={() => navigate('/student/notices')}
                className="text-xs font-bold text-[#FF6B2C] hover:underline"
              >
                {tx('View all')}
              </button>
            </div>

            <div className="space-y-2.5">
              {latestNotices.length === 0 && <EmptyMessage text="No notices." />}
              {latestNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 hover:border-orange-200 transition-all cursor-pointer"
                  onClick={() => navigate('/student/notices')}
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-1 flex-1">{notice.title}</p>
                  <span className="px-2.5 py-0.5 bg-orange-100/80 text-[#FF6B2C] font-bold text-[10px] rounded-lg shrink-0">
                    {formatDate(notice.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
