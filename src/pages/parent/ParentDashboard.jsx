import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  DollarSign,
  AlertCircle,
  Award,
  Clock,
  BookOpen,
  Calendar,
  Users,
  ChevronDown,
  ArrowRight,
  Eye,
  CheckCircle2,
  Megaphone,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/data/feeData';

export const ParentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, selectedChild, switchChild } = useAuth();

  const [selectedFeeModal, setSelectedFeeModal] = useState(null);
  const [selectedExamModal, setSelectedExamModal] = useState(null);
  const [selectedNoticeModal, setSelectedNoticeModal] = useState(null);

  const linkedChildren = currentUser?.linkedChildren || [];
  const currentChild = selectedChild || linkedChildren[0] || {
    name: 'Yash Verma',
    className: '8-A',
    rollNumber: 24,
    studentId: 'STU-2026-0824',
    attendanceStats: { rate: 92, present: 110, absent: 10, totalDays: 120 },
    feeSummary: { total: 10700, paid: 7700, pending: 3000 },
    academicStats: { average: 84.6, testsCount: 6 },
  };

  // 1. DYNAMIC SUMMARY CARDS DATA FOR SELECTED CHILD
  const attendanceData = currentChild.attendanceStats || { rate: 92, present: 110, absent: 10 };
  const feeSummary = currentChild.feeSummary || { total: 10700, paid: 7700, pending: 3000 };
  const academicStats = currentChild.academicStats || { average: 84.6, testsCount: 6 };

  // 2. TODAY'S TIMETABLE (FOR SELECTED CHILD'S CLASS)
  const todayTimetable = useMemo(() => {
    if (currentChild.className === '8-A') {
      return [
        { period: 'P1', subject: 'Hindi', teacher: 'Farhat Jahan', time: '8:00 – 8:45' },
        { period: 'P2', subject: 'Mathematics', teacher: 'Shahid Ali', time: '8:45 – 9:30' },
        { period: 'P3', subject: 'Science', teacher: 'Javed Akhtar', time: '9:45 – 10:30' },
        { period: 'P4', subject: 'Computer Science', teacher: 'Priya Verma', time: '10:30 – 11:15' },
        { period: 'P5', subject: 'Social Studies', teacher: 'Rajesh Kumar', time: '11:15 – 12:00' },
        { period: 'P6', subject: 'English', teacher: 'Neelam Gupta', time: '12:45 – 1:30' },
        { period: 'P7', subject: 'Islamic Studies', teacher: 'Nazia Sultana', time: '1:30 – 2:15' },
      ];
    }
    // Class 5-B
    return [
      { period: 'P1', subject: 'Mathematics', teacher: 'Anjali Singh', time: '8:00 – 8:45' },
      { period: 'P2', subject: 'Hindi', teacher: 'Farhat Jahan', time: '8:45 – 9:30' },
      { period: 'P3', subject: 'Science', teacher: 'Vikram Mehta', time: '9:45 – 10:30' },
      { period: 'P4', subject: 'English', teacher: 'Priya Sharma', time: '10:30 – 11:15' },
      { period: 'P5', subject: 'Computer Science', teacher: 'Priya Verma', time: '11:15 – 12:00' },
      { period: 'P6', subject: 'Art & Craft', teacher: 'Rehana Begum', time: '12:45 – 1:30' },
      { period: 'P7', subject: 'Moral Science', teacher: 'Nazia Sultana', time: '1:30 – 2:15' },
    ];
  }, [currentChild.className]);

  // 3. FEE HISTORY LIST (MATCHING SCREENSHOT)
  const feeHistoryList = useMemo(() => {
    if (currentChild.className === '8-A') {
      return [
        {
          id: 'FEE-01',
          feeType: 'Tuition Fee — Quarter 1 (2026-27)',
          amount: 4500,
          amountPaid: 4500,
          date: '21/04/2026',
          status: 'paid',
          receiptNo: 'REC-1021',
          method: 'UPI',
        },
        {
          id: 'FEE-02',
          feeType: 'Tuition Fee — Quarter 2 (2026-27)',
          amount: 4500,
          amountPaid: 2500,
          date: '22/07/2026',
          status: 'partial',
          receiptNo: 'REC-1054',
          method: 'Cash',
        },
        {
          id: 'FEE-03',
          feeType: 'Admission & Development Fee (2026-27)',
          amount: 3200,
          amountPaid: 3200,
          date: '30/03/2026',
          status: 'paid',
          receiptNo: 'REC-0980',
          method: 'Cheque',
        },
        {
          id: 'FEE-04',
          feeType: 'Examination Fee — Half Yearly',
          amount: 800,
          amountPaid: 0,
          date: '31/08/2026',
          status: 'pending',
          receiptNo: 'REC-PENDING',
          method: '—',
        },
      ];
    }
    // Ananya (5-B)
    return [
      {
        id: 'FEE-11',
        feeType: 'Tuition Fee — Quarter 1 (2026-27)',
        amount: 3900,
        amountPaid: 3900,
        date: '21/04/2026',
        status: 'paid',
        receiptNo: 'REC-2011',
        method: 'UPI',
      },
      {
        id: 'FEE-12',
        feeType: 'Tuition Fee — Quarter 2 (2026-27)',
        amount: 3900,
        amountPaid: 3900,
        date: '22/07/2026',
        status: 'paid',
        receiptNo: 'REC-2045',
        method: 'Net Banking',
      },
      {
        id: 'FEE-13',
        feeType: 'Annual Library & Activity Fee',
        amount: 2000,
        amountPaid: 0,
        date: '10/09/2026',
        status: 'pending',
        receiptNo: 'REC-PENDING-2',
        method: '—',
      },
    ];
  }, [currentChild.className]);

  // 4. UPCOMING EXAMS (MATCHING SCREENSHOT)
  const upcomingExams = [
    {
      id: 'EX-01',
      subject: 'English',
      name: 'Unit Test 2 — English',
      date: '28 Aug',
      time: '09:00',
      badge: 'unit-test',
      syllabus: 'Grammar (Tenses, Modals) & Literature Ch 3-4',
    },
    {
      id: 'EX-02',
      subject: 'English',
      name: 'Unit Test 2 — English',
      date: '28 Aug',
      time: '09:00',
      badge: 'unit-test',
      syllabus: 'Reading comprehension and paragraph writing',
    },
    {
      id: 'EX-03',
      subject: 'Hindi',
      name: 'Unit Test 2 — Hindi',
      date: '29 Aug',
      time: '09:00',
      badge: 'unit-test',
      syllabus: 'Vyakaran (Sandhi, Samas) and Kavita Vachan',
    },
    {
      id: 'EX-04',
      subject: 'Hindi',
      name: 'Unit Test 2 — Hindi',
      date: '29 Aug',
      time: '09:00',
      badge: 'unit-test',
      syllabus: 'Nibandh Lekhan and Path 5-6 Prashnottar',
    },
    {
      id: 'EX-05',
      subject: 'Mathematics',
      name: 'Unit Test 2 — Mathematics',
      date: '30 Aug',
      time: '09:00',
      badge: 'unit-test',
      syllabus: 'Linear Equations, Algebraic Expressions & Exponents',
    },
  ];

  // 5. SCHOOL NOTICES (MATCHING SCREENSHOT)
  const schoolNotices = [
    {
      id: 'NOT-01',
      title: 'Half Yearly Examination Datesheet Released',
      snippet: 'The datesheet for the Half Yearly Examination has been published on the notice board and in the ap...',
      date: '15/08/2026',
      fullText:
        'The datesheet for the Half Yearly Examination (2026-27) has been published on the notice board and in the student portal. Exams will commence from 15th September 2026. Please ensure thorough revision.',
    },
    {
      id: 'NOT-02',
      title: 'Parent–Teacher Meeting',
      snippet: 'A Parent–Teacher Meeting for all classes will be held from 9:00 AM to 1:00 PM in the respective...',
      date: '13/08/2026',
      fullText:
        'A Parent–Teacher Meeting for all classes will be held on Saturday, 23rd August from 9:00 AM to 1:00 PM. Parents can discuss student progress, attendance, and quarterly test evaluation with subject instructors.',
    },
    {
      id: 'NOT-03',
      title: 'Quarter 2 Fee Payment Reminder',
      snippet: 'Parents are reminded to clear the Quarter 2 tuition fee at the earliest. A late fee will be applicable on...',
      date: '11/08/2026',
      fullText:
        'Parents are reminded to clear the Quarter 2 tuition fee at the earliest. A late fee will be applicable on fees submitted after the 25th of this month. Online payments can be made through the parent portal.',
    },
    {
      id: 'NOT-04',
      title: 'Class 10 Board Preparation Extra Classes',
      snippet: 'Extra preparatory classes for Class 10 will be conducted every Saturday from 9:00 AM to 12:00...',
      date: '09/08/2026',
      fullText:
        'Extra preparatory classes for Class 10 and Class 8 will be conducted every Saturday from 9:00 AM to 12:00 PM covering Science numericals and Mathematics problem-solving.',
    },
    {
      id: 'NOT-05',
      title: 'Independence Day Celebration',
      snippet: 'The school will celebrate Independence Day with flag hoisting at 8:00 AM followed by cultural...',
      date: '08/08/2026',
      fullText:
        'The school will celebrate Independence Day with flag hoisting at 8:00 AM followed by student march-past and cultural programs in the school auditorium. All parents are warmly invited.',
    },
  ];

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
            {currentChild.avatar}
          </div>
          <div className="flex-1 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Viewing Child
            </span>
            <select
              value={currentChild.studentId}
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

      {/* 4 SUMMARY CARDS (Clickable, Matching Design) */}
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
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{attendanceData.rate}%</h3>
            <p className="text-xs text-cyan-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>↗ {attendanceData.present} Present • {attendanceData.absent} Absent</span>
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
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">₹{feeSummary.total.toLocaleString()}</h3>
            <p className="text-xs text-emerald-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>↗ ₹{feeSummary.paid.toLocaleString()} paid • View Ledger →</span>
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
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">₹{feeSummary.pending.toLocaleString()}</h3>
            <p className="text-xs text-orange-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>↘ Due soon • View Dues →</span>
            </p>
          </div>
        </div>

        {/* CARD 4: Academic Performance */}
        <div
          onClick={() => navigate('/parent/results')}
          className="bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/15 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Average Performance</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{academicStats.average}%</h3>
            <p className="text-xs text-indigo-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>↗ {academicStats.testsCount} Tests Taken • Grade A</span>
            </p>
          </div>
        </div>
      </div>

      {/* TODAY'S TIMETABLE (FOR SELECTED CHILD'S CLASS) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF6B2C]" />
            <span>Today's Timetable — {currentChild.name} (Class {currentChild.className})</span>
          </h2>
          <span className="text-xs font-semibold text-slate-400">Class {currentChild.className}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {todayTimetable.map((slot, index) => (
            <div
              key={index}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-orange-50/40 border border-slate-200/80 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#EA580C] font-black text-xs flex items-center justify-center">
                  {slot.period}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{slot.time}</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{slot.subject}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{slot.teacher}</p>
            </div>
          ))}
        </div>
      </div>

      {/* LOWER 3-COLUMN SECTION (MATCHING SCREENSHOT media_1790614006598.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: FEE HISTORY */}
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

          <div className="space-y-3">
            {feeHistoryList.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedFeeModal(item)}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#FF6B2C]/40 hover:shadow-xs bg-white transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#FF6B2C] transition-colors leading-snug">
                    {item.feeType}
                  </h4>
                  <p className="text-[11px] text-slate-400">{item.date}</p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-xs font-bold text-slate-900">
                    Rs. {item.amount}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      item.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'partial'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
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
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {exam.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {exam.date} • {exam.time}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-100 shrink-0">
                  {exam.badge}
                </span>
              </div>
            ))}
          </div>
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

          <div className="space-y-3">
            {schoolNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => setSelectedNoticeModal(notice)}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-[#FF6B2C]/40 hover:shadow-xs bg-white transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#FF6B2C] transition-colors leading-tight">
                      {notice.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {notice.snippet}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{notice.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                  <p className="text-xs font-mono font-bold text-[#FF6B2C]">{selectedFeeModal.receiptNo}</p>
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
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{currentChild.name} (Class {currentChild.className})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Particular:</span>
                <span className="font-bold text-slate-800">{selectedFeeModal.feeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Charge:</span>
                <span className="font-bold text-slate-900">Rs. {selectedFeeModal.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">Rs. {selectedFeeModal.amountPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date / Paid On:</span>
                <span className="font-semibold text-slate-800">{selectedFeeModal.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-800">{selectedFeeModal.method}</span>
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
                  <p className="text-xs text-slate-500">{selectedExamModal.name}</p>
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
                <span className="font-bold text-slate-800">{currentChild.name} (Class {currentChild.className})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-800">{selectedExamModal.date} • {selectedExamModal.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exam Category:</span>
                <span className="font-bold text-[#EA580C] uppercase text-xs">{selectedExamModal.badge}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-bold block mb-1">Syllabus Covered:</span>
                <p className="text-slate-700 leading-relaxed">{selectedExamModal.syllabus}</p>
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
                  <p className="text-xs text-slate-500">Published on {selectedNoticeModal.date}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNoticeModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>{selectedNoticeModal.fullText}</p>
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
