import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  AlertCircle,
  Award,
  Clock,
  BookOpen,
  Megaphone,
  X,
  CreditCard,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatCurrency, formatDate, formatDateTime, weekdayName } from '@/utils';

const DUE_STATUS_STYLES = {
  Paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Partial: 'bg-amber-50 text-amber-700 border border-amber-200',
  Overdue: 'bg-rose-50 text-rose-700 border border-rose-200',
  Pending: 'bg-orange-50 text-orange-700 border border-orange-200',
};

export const ParentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, selectedChild, switchChild } = useAuth();
  const linkedChildren = currentUser?.linkedChildren || [];
  const childId = selectedChild?.studentId ?? null;

  const dashboard = useApi('/dashboard');
  const results = useApi(childId ? `/results/students/${encodeURIComponent(childId)}` : null);

  const [selectedFeeModal, setSelectedFeeModal] = useState(null);
  const [selectedExamModal, setSelectedExamModal] = useState(null);
  const [selectedNoticeModal, setSelectedNoticeModal] = useState(null);

  if (!selectedChild) {
    return <EmptyMessage text="No child is linked to this parent account yet. Please contact the school office." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner & Child Selector Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Parent Dashboard
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Monitor your child's academic progress, attendance and school activities.
          </p>
        </div>

        {/* Child Selector Pill/Card */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 sm:p-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B2C] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {selectedChild.avatar}
          </div>
          <div className="flex-1 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Viewing Child
            </span>
            <select
              value={selectedChild.studentId}
              onChange={(e) => switchChild(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer pr-4"
            >
              {linkedChildren.map((child) => (
                <option key={child.studentId} value={child.studentId}>
                  {child.name} — Class {child.className} (Roll #{child.rollNumber})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <AsyncState state={dashboard} loadingText="Loading dashboard…">
        {(data) => {
          const overview = (data?.children || []).find((c) => c.student?.id === childId);
          if (!overview) {
            return <EmptyMessage text={`No dashboard data available for ${selectedChild.name}.`} />;
          }
          const attendance = overview.attendance || {};
          const fees = overview.fees || {};
          const dues = fees.dues || [];
          const todaySchedule = overview.todaySchedule || [];
          const upcomingExams = overview.upcomingExams || [];
          const recentResults = overview.recentResults || [];
          const homeworkDue = overview.homeworkDue || [];
          const notices = overview.recentNotices || [];
          const result = results.data;

          return (
            <>
              {/* 4 SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* CARD 1: Attendance */}
                <div
                  onClick={() => navigate('/parent/attendance')}
                  className="bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-500 text-white p-6 rounded-3xl shadow-lg shadow-cyan-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-100 uppercase tracking-wider">Attendance</span>
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
                      {attendance.rate == null ? '—' : `${attendance.rate}%`}
                    </h3>
                    <p className="text-xs text-cyan-100 font-semibold mt-1.5 flex items-center gap-1">
                      {attendance.workingDays ? (
                        <span>
                          {attendance.present ?? 0} Present • {attendance.absent ?? 0} Absent • {attendance.workingDays} days
                        </span>
                      ) : (
                        <span>No attendance recorded yet</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* CARD 2: Total Fees */}
                <div
                  onClick={() => navigate('/parent/fees')}
                  className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Fees</span>
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

                {/* CARD 3: Fee Pending */}
                <div
                  onClick={() => navigate('/parent/fees?filter=pending')}
                  className="bg-gradient-to-br from-orange-400 via-[#FF6B2C] to-amber-500 text-white p-6 rounded-3xl shadow-lg shadow-orange-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">Fee Pending</span>
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <AlertCircle className="w-5 h-5 stroke-[2.2]" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{formatCurrency(fees.pending)}</h3>
                    <p className="text-xs text-orange-100 font-semibold mt-1.5 flex items-center gap-1">
                      <span>
                        {fees.overdue > 0 ? `${formatCurrency(fees.overdue)} overdue` : 'Nothing overdue'} • View Dues →
                      </span>
                    </p>
                  </div>
                </div>

                {/* CARD 4: Academic Performance */}
                <div
                  onClick={() => navigate('/parent/results')}
                  className="bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Overall Performance</span>
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Award className="w-5 h-5 stroke-[2.2]" />
                    </div>
                  </div>
                  <div className="mt-4">
                    {results.loading ? (
                      <h3 className="text-xl font-bold">Loading…</h3>
                    ) : results.error ? (
                      <p className="text-xs font-semibold text-indigo-100">{results.error.message}</p>
                    ) : result?.subjects?.length ? (
                      <>
                        <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{result.percentage}%</h3>
                        <p className="text-xs text-indigo-100 font-semibold mt-1.5 flex items-center gap-1">
                          <span>
                            {result.subjects.length} papers • Grade {result.grade}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-3xl sm:text-4xl font-black tracking-tight">—</h3>
                        <p className="text-xs text-indigo-100 font-semibold mt-1.5">No published results yet</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* TODAY'S TIMETABLE */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF6B2C]" />
                    <span>
                      Today's Timetable — {selectedChild.name} (Class {selectedChild.className})
                    </span>
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">
                    {data.date ? `${weekdayName(data.date)}, ${formatDate(data.date)}` : ''}
                  </span>
                </div>

                {todaySchedule.length === 0 ? (
                  <EmptyMessage text="No classes scheduled for today." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                    {todaySchedule.map((slot) => {
                      const isBreak = slot.type === 'break';
                      return (
                        <div
                          key={slot.periodId}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            isBreak
                              ? 'bg-slate-100/60 border-dashed border-slate-200'
                              : 'bg-slate-50 hover:bg-orange-50/40 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 gap-1">
                            <span className="px-1.5 h-6 rounded-lg bg-orange-100 text-[#EA580C] font-black text-[10px] flex items-center justify-center truncate">
                              {slot.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              {slot.startTime}–{slot.endTime}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                            {isBreak ? 'Break' : slot.subject || 'Free period'}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {slot.teacherName || ''}
                            {slot.room ? ` • ${slot.room}` : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LOWER 3-COLUMN SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* COLUMN 1: FEE DUES */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#FF6B2C]" />
                      <span>Fee History</span>
                    </h3>
                    <button
                      onClick={() => navigate('/parent/fees')}
                      className="text-xs font-bold text-[#FF6B2C] hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>

                  {dues.length === 0 ? (
                    <EmptyMessage text="No fees billed yet." />
                  ) : (
                    <div className="space-y-3">
                      {dues.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedFeeModal(item)}
                          className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#FF6B2C]/40 hover:shadow-xs bg-white transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#FF6B2C] transition-colors leading-snug">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-400">Due {formatDate(item.dueDate)}</p>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <div className="text-xs font-bold text-slate-900">{formatCurrency(item.amount)}</div>
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                DUE_STATUS_STYLES[item.status] || DUE_STATUS_STYLES.Pending
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* COLUMN 2: UPCOMING EXAMS */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#FF6B2C]" />
                      <span>Upcoming Exams</span>
                    </h3>
                    <button
                      onClick={() => navigate('/parent/results')}
                      className="text-xs font-bold text-[#FF6B2C] hover:underline cursor-pointer"
                    >
                      Results →
                    </button>
                  </div>

                  {upcomingExams.length === 0 ? (
                    <EmptyMessage text="No upcoming exams." />
                  ) : (
                    <div className="space-y-3">
                      {upcomingExams.map((exam) => (
                        <div
                          key={exam.scheduleId}
                          onClick={() => setSelectedExamModal(exam)}
                          className="p-3 rounded-2xl border border-slate-200 hover:border-[#FF6B2C]/40 hover:shadow-xs bg-white transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FF6B2C] flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#FF6B2C] transition-colors leading-tight">
                                {exam.subject}
                              </h4>
                              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{exam.examName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatDate(exam.date)} • {exam.startTime}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-100 shrink-0">
                            {exam.maxMarks} marks
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* COLUMN 3: SCHOOL NOTICES */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-[#FF6B2C]" />
                      <span>School Notices</span>
                    </h3>
                    <button
                      onClick={() => navigate('/parent/notices')}
                      className="text-xs font-bold text-[#FF6B2C] hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>

                  {notices.length === 0 ? (
                    <EmptyMessage text="No notices right now." />
                  ) : (
                    <div className="space-y-3">
                      {notices.map((notice) => (
                        <div
                          key={notice.id}
                          onClick={() => setSelectedNoticeModal(notice)}
                          className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#FF6B2C]/40 hover:shadow-xs bg-white transition-all cursor-pointer space-y-1 group"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                                notice.priority === 'high'
                                  ? 'bg-rose-500'
                                  : notice.priority === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#FF6B2C] transition-colors leading-tight">
                                {notice.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                {notice.description}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                {formatDate(notice.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RECENT RESULTS & HOMEWORK */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#FF6B2C]" />
                      <span>Recent Results</span>
                    </h3>
                    <button
                      onClick={() => navigate('/parent/results')}
                      className="text-xs font-bold text-[#FF6B2C] hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  {recentResults.length === 0 ? (
                    <EmptyMessage text="No published results yet." />
                  ) : (
                    <div className="space-y-2.5">
                      {[...recentResults].reverse().map((r) => (
                        <div
                          key={`${r.examId}-${r.subject}`}
                          className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{r.subject}</h4>
                            <p className="text-[11px] text-slate-400">
                              {r.examName} • {formatDate(r.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">
                              {r.absent ? 'Absent' : `${r.obtainedMarks}/${r.maxMarks}`}
                            </div>
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                r.passed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {r.grade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-[#FF6B2C]" />
                      <span>Homework Due</span>
                    </h3>
                  </div>
                  {homeworkDue.length === 0 ? (
                    <EmptyMessage text="No homework due." />
                  ) : (
                    <div className="space-y-2.5">
                      {homeworkDue.map((hw) => (
                        <div key={hw.id} className="p-3 rounded-2xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-800">{hw.title}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-100 shrink-0">
                              Due {formatDate(hw.dueDate)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {hw.subject} • {hw.teacherName}
                          </p>
                          {hw.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">{hw.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        }}
      </AsyncState>

      {/* FEE DETAILS MODAL */}
      {selectedFeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Fee Details</h3>
                  <p className="text-xs font-mono font-bold text-[#FF6B2C]">{selectedFeeModal.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeeModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800 text-right">
                  {selectedFeeModal.studentName} (Class {selectedFeeModal.className})
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Fee Particular:</span>
                <span className="font-bold text-slate-800 text-right">{selectedFeeModal.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Charge:</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedFeeModal.amount)}</span>
              </div>
              {selectedFeeModal.concession > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Concession:</span>
                  <span className="font-bold text-indigo-600">−{formatCurrency(selectedFeeModal.concession)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedFeeModal.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending:</span>
                <span className="font-bold text-rose-600">{formatCurrency(selectedFeeModal.pending)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedFeeModal.dueDate)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold uppercase text-xs text-[#EA580C]">{selectedFeeModal.status}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setSelectedFeeModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedFeeModal(null);
                  navigate('/parent/fees');
                }}
                className="px-4 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Go to Fee Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXAM DETAILS MODAL */}
      {selectedExamModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedExamModal.subject}</h3>
                  <p className="text-xs text-slate-500">{selectedExamModal.examName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExamModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">
                  {selectedChild.name} (Class {selectedExamModal.className})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedExamModal.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-bold text-slate-800">
                  {selectedExamModal.startTime} – {selectedExamModal.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maximum Marks:</span>
                <span className="font-bold text-[#EA580C]">{selectedExamModal.maxMarks}</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedExamModal(null)}
                className="w-full py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE DETAILS MODAL */}
      {selectedNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedNoticeModal.title}</h3>
                  <p className="text-xs text-slate-500">
                    Published on {formatDateTime(selectedNoticeModal.createdAt)}
                    {selectedNoticeModal.authorName ? ` by ${selectedNoticeModal.authorName}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNoticeModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              <p>{selectedNoticeModal.description}</p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedNoticeModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
