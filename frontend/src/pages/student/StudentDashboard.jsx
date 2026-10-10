import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  DollarSign,
  AlertCircle,
  FileText,
  Clock,
  Megaphone,
  CheckCircle2,
  Calendar,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { students, attendanceRecords, exams, schedules, notices } = useData();

  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const studentName = currentUser?.name || 'Rohit Verma';
  const studentId = currentUser?.studentId || 'STU-2026-0503';
  const className = currentUser?.className || '5-B';

  // 1. DYNAMIC ATTENDANCE FOR STUDENT
  const attendanceData = useMemo(() => {
    const studentRecs = attendanceRecords.filter((r) => r.studentId === studentId);
    if (studentRecs.length === 0) {
      return {
        rate: '92%',
        present: 22,
        absent: 2,
        late: 0,
        total: 24,
      };
    }
    const present = studentRecs.filter((r) => r.status === 'present').length;
    const late = studentRecs.filter((r) => r.status === 'late').length;
    const absent = studentRecs.filter((r) => r.status === 'absent').length;
    const total = studentRecs.length;
    const effectivePresent = present + late;
    const rate = total > 0 ? `${Math.round((effectivePresent / total) * 100)}%` : '92%';

    return {
      rate,
      present: effectivePresent || 22,
      absent: absent || 2,
      late,
      total: total || 24,
    };
  }, [attendanceRecords, studentId]);

  // 2. FEES SUMMARY
  const feeSummary = useMemo(() => {
    return (
      currentUser?.feeSummary || {
        total: 10700,
        paid: 7700,
        pending: 3000,
      }
    );
  }, [currentUser]);

  // 3. UPCOMING EXAMS
  const upcomingExamsList = useMemo(() => {
    return [
      { id: 'ex-1', subject: 'Mathematics', name: 'Test', date: '25 Aug', maxMarks: 25 },
      { id: 'ex-2', subject: 'Science', name: 'Midterm', date: '10 Sep', maxMarks: 80 },
    ];
  }, []);

  // 4. TODAY'S TIMETABLE (Chronological for Student's Class)
  const todayTimetable = useMemo(() => {
    return [
      { period: 'P1', subject: 'Hindi', teacher: 'Farhat Jahan', time: '8:00 – 8:45' },
      { period: 'P2', subject: 'Mathematics', teacher: 'Shahid Ali', time: '8:45 – 9:30' },
      { period: 'P3', subject: 'Environmental Studies', teacher: 'Javed Akhtar', time: '9:45 – 10:30' },
      { period: 'P4', subject: 'Computer Science', teacher: 'Priya Verma', time: '10:30 – 11:15' },
      { period: 'P5', subject: 'Art & Craft', teacher: 'Rehana Begum', time: '11:15 – 12:00' },
      { period: 'P6', GeneralKnowledge: 'General Knowledge', subject: 'General Knowledge', teacher: 'Deepak Kumar', time: '12:45 – 1:30' },
      { period: 'P7', subject: 'Islamic Studies', teacher: 'Nazia Sultana', time: '1:30 – 2:15' },
    ];
  }, []);

  // 5. NOTICES
  const latestNotices = useMemo(() => {
    return [
      { id: 'not-1', title: 'Change in School Timings', date: '30 Jul' },
      { id: 'not-2', title: 'Half Yearly Examination Datesheet Released', date: '15 Aug' },
      { id: 'not-3', title: 'Quarter 2 Fee Payment Reminder', date: '11 Aug' },
      { id: 'not-4', title: 'Parent–Teacher Meeting', date: '13 Aug' },
    ];
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {/* Toast Notification (matching screenshot) */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Welcome back!</h4>
            <p className="text-[11px] text-slate-500">Logged in as Student.</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Student Dashboard
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Your academic progress and daily activities.
        </p>
      </div>

      {/* 4 VIBRANT SUMMARY CARDS (Matching Reference Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: Attendance (Cyan/Sky Card) */}
        <div
          onClick={() => navigate('/student/attendance')}
          className="bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-500 text-white p-6 rounded-3xl shadow-lg shadow-cyan-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-100 uppercase tracking-wider">Attendance</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{attendanceData.rate}</h3>
            <p className="text-xs text-cyan-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>↗ {attendanceData.present}P • {attendanceData.absent}A • 0L</span>
            </p>
          </div>
        </div>

        {/* CARD 2: Total Fees (Green Card) */}
        <div
          onClick={() => navigate('/student/fees')}
          className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Fees</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">₹{feeSummary.total.toLocaleString()}</h3>
            <p className="text-xs text-emerald-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>↗ ₹{feeSummary.paid.toLocaleString()} paid • View Ledger →</span>
            </p>
          </div>
        </div>

        {/* CARD 3: Fee Pending (Orange/Peach Card) */}
        <div
          onClick={() => navigate('/student/fees?filter=pending')}
          className="bg-gradient-to-br from-orange-400 via-[#FF6B2C] to-amber-500 text-white p-6 rounded-3xl shadow-lg shadow-orange-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">Fee Pending</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">₹{feeSummary.pending.toLocaleString()}</h3>
            <p className="text-xs text-orange-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>↘ Pay soon • View Dues →</span>
            </p>
          </div>
        </div>

        {/* CARD 4: Upcoming Exams (Blue/Indigo Card) */}
        <div
          onClick={() => navigate('/student/exams?filter=upcoming')}
          className="bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Upcoming Exams</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{upcomingExamsList.length}</h3>
            <p className="text-xs text-indigo-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>↗ Next: {upcomingExamsList[0]?.date || '25 Aug'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION (Matching Reference Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TODAY'S TIMETABLE (~60% / 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF6B2C]" />
              <span>Today's Timetable</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">Class {className}</span>
          </div>

          <div className="space-y-2.5">
            {todayTimetable.map((slot, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3.5 bg-slate-50/60 hover:bg-orange-50/40 rounded-2xl border border-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-8 h-8 rounded-xl bg-orange-100/80 text-[#FF6B2C] font-black text-xs flex items-center justify-center shrink-0">
                    {slot.period}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{slot.subject}</h4>
                    <p className="text-[11px] font-medium text-slate-400">{slot.teacher}</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-xs">
                  {slot.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: UPCOMING EXAMS & NOTICES (~40% / 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* UPCOMING EXAMS CARD */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF6B2C]" />
                <span>Upcoming Exams</span>
              </h2>
              <button
                onClick={() => navigate('/student/exams')}
                className="text-xs font-bold text-[#FF6B2C] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {upcomingExamsList.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between hover:border-orange-200 transition-all"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{exam.subject}</h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{exam.name}</p>
                  </div>

                  <span className="px-3 py-1 bg-orange-100/80 text-[#FF6B2C] font-bold text-xs rounded-xl border border-orange-200/60">
                    {exam.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* NOTICES CARD */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#FF6B2C]" />
                <span>Notices</span>
              </h2>
              <button
                onClick={() => navigate('/student/notices')}
                className="text-xs font-bold text-[#FF6B2C] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {latestNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 hover:border-orange-200 transition-all cursor-pointer"
                  onClick={() => navigate('/student/notices')}
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-1 flex-1">
                    {notice.title}
                  </p>
                  <span className="px-2.5 py-0.5 bg-orange-100/80 text-[#FF6B2C] font-bold text-[10px] rounded-lg shrink-0">
                    {notice.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
