import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CalendarCheck,
  BookOpenCheck,
  FileCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  TrendingUp,
  Award,
  AlertCircle,
  Megaphone,
  Plus,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { INITIAL_PERIODS } from '@/data/timetableData';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { students, attendanceRecords, homeworkList, exams, schedules, marksRecords, notices } = useData();

  const assignedClasses = currentUser?.assignedClasses || ['5-B', '6-A'];
  const teacherSubjects = currentUser?.subjects || ['Mathematics', 'Science'];
  const teacherName = currentUser?.name || 'Anjali Singh';

  // 1. CLASS SELECTOR STATE: 'ALL' or specific class e.g. '5-B' or '6-A'
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Format today's date
  const todayDateObj = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedTodayDate = todayDateObj.toLocaleDateString('en-US', options);

  // Active Classes list based on filter
  const activeClasses = useMemo(() => {
    return selectedClass === 'ALL' ? assignedClasses : [selectedClass];
  }, [selectedClass, assignedClasses]);

  // 2. FILTERED STUDENTS FOR ACTIVE CLASSES
  const filteredStudents = useMemo(() => {
    return students.filter((s) => activeClasses.includes(s.className));
  }, [students, activeClasses]);

  // 3. ATTENDANCE COMPUTATIONS FOR ACTIVE CLASSES
  const attendanceStats = useMemo(() => {
    const todayStr = '2026-09-28';
    const studentIds = new Set(filteredStudents.map((s) => s.studentId || s.id));

    const todayRecs = attendanceRecords.filter(
      (r) => r.date === todayStr && studentIds.has(r.studentId)
    );

    const present = todayRecs.filter((r) => r.status === 'present').length;
    const late = todayRecs.filter((r) => r.status === 'late').length;
    const absent = todayRecs.filter((r) => r.status === 'absent').length;
    const leave = todayRecs.filter((r) => r.status === 'leave').length;
    const totalWorking = present + late + absent;

    const rate = totalWorking > 0 ? Math.round(((present + late) / totalWorking) * 100) : 92;

    return {
      rate: `${rate}%`,
      numericRate: rate,
      present: present || Math.round(filteredStudents.length * 0.9),
      absent: absent || Math.max(1, Math.round(filteredStudents.length * 0.05)),
      late: late || 1,
      leave: leave || 0,
      total: filteredStudents.length,
    };
  }, [attendanceRecords, filteredStudents]);

  // Class-wise breakdown for "Class Attendance" section
  const classAttendanceBreakdown = useMemo(() => {
    return assignedClasses.map((cls) => {
      const clsStudents = students.filter((s) => s.className === cls);
      const studentIds = new Set(clsStudents.map((s) => s.studentId || s.id));
      const todayRecs = attendanceRecords.filter(
        (r) => r.date === '2026-09-28' && studentIds.has(r.studentId)
      );

      const present = todayRecs.filter((r) => r.status === 'present').length || (cls === '5-B' ? 30 : 28);
      const absent = todayRecs.filter((r) => r.status === 'absent').length || (cls === '5-B' ? 1 : 3);
      const late = todayRecs.filter((r) => r.status === 'late').length || 1;
      const total = clsStudents.length || 34;
      const rate = Math.round(((present + late) / (present + late + absent)) * 100) || (cls === '5-B' ? 94 : 90);

      return {
        className: cls,
        rate,
        present,
        absent,
        late,
        total,
      };
    });
  }, [assignedClasses, students, attendanceRecords]);

  // 4. TODAY'S SCHEDULE (MONDAY) FILTERED BY CLASS
  const todaySchedule = useMemo(() => {
    const allTeacherPeriods = [
      {
        id: 'sch-1',
        time: '08:00 – 08:45',
        subject: 'Mathematics',
        className: '5-B',
        room: 'Room 101',
        status: 'Completed',
      },
      {
        id: 'sch-2',
        time: '09:00 – 09:45',
        subject: 'Science',
        className: '6-A',
        room: 'Room 204',
        status: 'Completed',
      },
      {
        id: 'sch-3',
        time: '10:30 – 11:15',
        subject: 'Mathematics',
        className: '5-B',
        room: 'Room 101',
        status: 'NOW', // Current highlighted period
      },
      {
        id: 'sch-4',
        time: '11:30 – 12:15',
        subject: 'Science',
        className: '6-A',
        room: 'Room 204',
        status: 'Upcoming',
      },
    ];

    if (selectedClass === 'ALL') return allTeacherPeriods;
    return allTeacherPeriods.filter((p) => p.className === selectedClass);
  }, [selectedClass]);

  // 5. ACADEMIC PERFORMANCE (Calculated dynamically from marksRecords)
  const performanceStats = useMemo(() => {
    const relevantMarks = marksRecords.filter(
      (m) => activeClasses.includes(m.className) && teacherSubjects.includes(m.subject)
    );

    if (relevantMarks.length === 0) {
      return {
        avg: 76,
        highest: 94,
        lowest: 42,
        passedCount: Math.round(filteredStudents.length * 0.9),
        totalCount: filteredStudents.length,
        subjects: [
          { subject: 'Mathematics', avg: 82 },
          { subject: 'Science', avg: 76 },
          { subject: 'English', avg: 74 },
          { subject: 'Hindi', avg: 79 },
        ],
      };
    }

    const validMarks = relevantMarks
      .filter((m) => !m.isAbsent && m.obtainedMarks !== '' && m.maxMarks > 0)
      .map((m) => (Number(m.obtainedMarks) / Number(m.maxMarks)) * 100);

    const avg = validMarks.length > 0 ? Math.round(validMarks.reduce((a, b) => a + b, 0) / validMarks.length) : 76;
    const highest = validMarks.length > 0 ? Math.round(Math.max(...validMarks)) : 94;
    const lowest = validMarks.length > 0 ? Math.round(Math.min(...validMarks)) : 42;
    const passed = validMarks.filter((p) => p >= 40).length;

    // Subject breakdown
    const mathMarks = relevantMarks.filter((m) => m.subject === 'Mathematics' && !m.isAbsent);
    const mathAvg = mathMarks.length > 0
      ? Math.round(mathMarks.reduce((acc, m) => acc + (Number(m.obtainedMarks) / Number(m.maxMarks)) * 100, 0) / mathMarks.length)
      : 82;

    const sciMarks = relevantMarks.filter((m) => m.subject === 'Science' && !m.isAbsent);
    const sciAvg = sciMarks.length > 0
      ? Math.round(sciMarks.reduce((acc, m) => acc + (Number(m.obtainedMarks) / Number(m.maxMarks)) * 100, 0) / sciMarks.length)
      : 76;

    return {
      avg,
      highest,
      lowest,
      passedCount: passed || Math.round(filteredStudents.length * 0.9),
      totalCount: validMarks.length || filteredStudents.length,
      subjects: [
        { subject: 'Mathematics', avg: mathAvg },
        { subject: 'Science', avg: sciAvg },
        { subject: 'English', avg: 74 },
        { subject: 'Hindi', avg: 79 },
      ],
    };
  }, [marksRecords, activeClasses, teacherSubjects, filteredStudents]);

  // 6. STUDENTS NEEDING ATTENTION (Attendance < 75% or Low Marks or Missing HW)
  const studentsNeedingAttention = useMemo(() => {
    const list = [];

    filteredStudents.forEach((st) => {
      const sId = st.studentId || st.id;
      const reasons = [];

      // Check attendance
      if (st.attendance && st.attendance < 90) {
        reasons.push({ label: `Low Attendance: ${st.attendance}%`, type: 'attendance' });
      }

      // Check marks in marksRecords
      const studentMarks = marksRecords.filter((m) => m.studentId === sId);
      const lowMarkRec = studentMarks.find((m) => !m.isAbsent && (m.obtainedMarks / m.maxMarks) < 0.5);
      if (lowMarkRec) {
        reasons.push({ label: `Low Marks: ${lowMarkRec.subject} (${lowMarkRec.obtainedMarks}/${lowMarkRec.maxMarks})`, type: 'marks' });
      }

      if (st.name === 'Saif Abbasi' || st.name === 'Rohit Verma' || st.name === 'Zoya Siddiqui') {
        if (!reasons.some((r) => r.type === 'homework')) {
          reasons.push({ label: 'Missing Homework', type: 'homework' });
        }
      }

      if (reasons.length > 0) {
        list.push({
          ...st,
          reasons,
        });
      }
    });

    return list.slice(0, 4);
  }, [filteredStudents, marksRecords]);

  // 7. UPCOMING EXAMS FILTERED BY CLASS
  const filteredExams = useMemo(() => {
    return schedules.filter((sch) => {
      const isClassMatch = activeClasses.includes(sch.className);
      const isSubjectMatch = teacherSubjects.includes(sch.subject);
      return isClassMatch && isSubjectMatch && (sch.status === 'Active' || sch.status === 'Upcoming' || sch.status === 'Scheduled');
    });
  }, [schedules, activeClasses, teacherSubjects]);

  // 8. PENDING MARKS COUNT & STATUS
  const marksOverview = useMemo(() => {
    const relevant = marksRecords.filter((m) => activeClasses.includes(m.className));
    const pending = relevant.filter((m) => m.status === 'Draft' || m.status === 'Not Entered' || m.obtainedMarks === '').length || 5;
    const submitted = relevant.filter((m) => m.status === 'Submitted').length || 12;
    const verified = 20;
    const published = 45;

    return { pending, submitted, verified, published };
  }, [marksRecords, activeClasses]);

  // 9. ACTIVE HOMEWORK FILTERED BY CLASS
  const activeHomework = useMemo(() => {
    return homeworkList.filter(
      (hw) => activeClasses.includes(hw.className) && (hw.status === 'Assigned' || hw.status === 'Pending')
    );
  }, [homeworkList, activeClasses]);

  // 10. RECENT ACTIVITY
  const recentActivities = useMemo(() => {
    const act = [
      { id: 'act-1', text: `Attendance marked for Class ${selectedClass === 'ALL' ? '5-B' : selectedClass}`, time: '10 minutes ago', type: 'attendance' },
      { id: 'act-2', text: 'Marks submitted for Mathematics Assessment Test 2', time: '1 hour ago', type: 'marks' },
      { id: 'act-3', text: 'Homework "Plant Cell Diagram" assigned to Class 6-A', time: '3 hours ago', type: 'homework' },
      { id: 'act-4', text: 'Notice posted for Parent–Teacher Meeting', time: 'Yesterday', type: 'notice' },
    ];
    return act;
  }, [selectedClass]);

  // 11. IMPORTANT NOTICES
  const importantNotices = useMemo(() => {
    return notices.slice(0, 3);
  }, [notices]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Welcome Header & Class Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B2C] mb-1">
            <CalendarIcon className="w-4 h-4 stroke-[2]" />
            <span>{formattedTodayDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Good morning, {teacherName.split(' ')[0]} • Your classes, attendance, and assignments overview.
          </p>
        </div>

        {/* Dynamic Class Selector Filter */}
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
            <option value="ALL">All Classes (5-B & 6-A)</option>
            {assignedClasses.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TOP 4 VIBRANT SUMMARY CARDS (Matching Screenshot Visuals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: My Classes (Blue/Indigo Gradient) */}
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
              <span>{selectedClass === 'ALL' ? `${assignedClasses.join(', ')} assigned` : `Class ${selectedClass} active`}</span>
            </p>
          </div>
        </div>

        {/* CARD 2: Total Students (Orange/Amber Gradient) */}
        <div className="bg-gradient-to-br from-[#FF6B2C] via-orange-500 to-amber-500 text-white p-6 rounded-3xl shadow-lg shadow-orange-500/15 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">Total Students</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
              {filteredStudents.length}
            </h3>
            <p className="text-xs text-orange-100 font-semibold mt-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{selectedClass === 'ALL' ? 'Across 2 assigned classes' : `Enrolled in ${selectedClass}`}</span>
            </p>
          </div>
        </div>

        {/* CARD 3: Today's Attendance (Cyan/Teal Gradient) */}
        <div className="bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-teal-500/15 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">Today's Attendance</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
              {attendanceStats.rate}
            </h3>
            <p className="text-xs text-teal-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>{attendanceStats.present} Present • {attendanceStats.absent} Absent</span>
            </p>
          </div>
        </div>

        {/* CARD 4: Assignments / Pending Marks (Coral/Rose Gradient) */}
        <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-orange-500 text-white p-6 rounded-3xl shadow-lg shadow-rose-500/15 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-100 uppercase tracking-wider">Assignments Pending</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <FileCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
              {activeHomework.length}
            </h3>
            <p className="text-xs text-rose-100 font-semibold mt-1.5 flex items-center gap-1">
              <span>{marksOverview.pending} marks awaiting entry</span>
            </p>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: WEEKLY ATTENDANCE TREND & CLASS PERFORMANCE (Matching Screenshot Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Weekly Attendance Trend Line Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF6B2C]" />
              <h2 className="text-base font-bold text-slate-900">
                Weekly Attendance Trend — {selectedClass === 'ALL' ? 'All Classes' : `Class ${selectedClass}`}
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              Avg: {attendanceStats.rate}
            </span>
          </div>

          {/* Line Chart SVG Representation */}
          <div className="h-56 w-full pt-4 relative flex flex-col justify-between">
            <svg viewBox="0 0 500 180" className="w-full h-44 overflow-visible">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="490" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="40" y1="60" x2="490" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="40" y1="100" x2="490" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="40" y1="140" x2="490" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

              {/* Y Axis Labels */}
              <text x="15" y="24" fontSize="10" fill="#94a3b8" fontWeight="600">100</text>
              <text x="20" y="64" fontSize="10" fill="#94a3b8" fontWeight="600">75</text>
              <text x="20" y="104" fontSize="10" fill="#94a3b8" fontWeight="600">50</text>
              <text x="20" y="144" fontSize="10" fill="#94a3b8" fontWeight="600">25</text>
              <text x="25" y="175" fontSize="10" fill="#94a3b8" fontWeight="600">0</text>

              {/* Trend Polyline */}
              <path
                d="M 50 35 Q 130 38, 190 32 T 310 40 T 410 25 T 480 20"
                fill="none"
                stroke="#FF6B2C"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="50" cy="35" r="5.5" fill="#FF6B2C" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="190" cy="32" r="5.5" fill="#FF6B2C" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="310" cy="40" r="5.5" fill="#FF6B2C" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="410" cy="25" r="5.5" fill="#FF6B2C" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="480" cy="20" r="5.5" fill="#FF6B2C" stroke="#ffffff" strokeWidth="2.5" />
            </svg>

            {/* X-axis week labels */}
            <div className="flex justify-between pl-10 pr-2 text-[11px] font-bold text-slate-500">
              <span>Mon (94%)</span>
              <span>Tue (91%)</span>
              <span>Wed (96%)</span>
              <span>Thu (92%)</span>
              <span>Fri (95%)</span>
            </div>
          </div>
        </div>

        {/* Right: Class Performance Average Bar Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Class Performance Average</h2>
            <span className="text-xs font-bold text-slate-500">
              Overall: {performanceStats.avg}%
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {performanceStats.subjects.map((sub, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">{sub.subject}</span>
                  <span className="text-[#FF6B2C]">{sub.avg}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 to-[#FF6B2C]"
                    style={{ width: `${sub.avg}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Highest: <strong className="text-slate-900">{performanceStats.highest}%</strong></span>
            <span>Lowest: <strong className="text-slate-900">{performanceStats.lowest}%</strong></span>
            <span>Passed: <strong className="text-emerald-600">{performanceStats.passedCount}/{performanceStats.totalCount}</strong></span>
          </div>
        </div>
      </div>

      {/* TODAY'S CLASS SCHEDULE (Prominent, with active NOW highlight) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF6B2C]" />
              <span>Today's Schedule — Monday</span>
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
                    <span className="text-[11px] font-semibold text-slate-400">
                      {item.status}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{item.subject}</h4>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                    <span className="text-slate-800 font-bold">Class {item.className}</span>
                    <span>•</span>
                    <span>{item.room}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CLASS ATTENDANCE & ATTENTION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Class Attendance Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Class Attendance Overview</h2>
              <p className="text-xs text-slate-500">Live attendance status for today</p>
            </div>

            <button
              onClick={() => navigate(`/teacher/attendance?class=${selectedClass === 'ALL' ? '5-B' : selectedClass}`)}
              className="px-4 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
            >
              Mark Attendance
            </button>
          </div>

          <div className="space-y-4">
            {classAttendanceBreakdown.map((item) => (
              <div
                key={item.className}
                className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Class {item.className}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{item.total} Students enrolled</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">{item.rate}%</span>
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
        </div>

        {/* Students Needing Attention (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Students Needing Attention</span>
              </h2>
              <p className="text-xs text-slate-500">Students with low attendance or academic alerts</p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-xl text-xs">
              {studentsNeedingAttention.length} Alerts
            </span>
          </div>

          <div className="space-y-3">
            {studentsNeedingAttention.map((st) => (
              <div
                key={st.id || st.studentId}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3 hover:border-amber-300 transition-all cursor-pointer"
                onClick={() => navigate(`/admin/students/${st.studentId || 'STU-2026-0501'}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-200">
                    {st.initials || st.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{st.name}</h4>
                    <span className="text-[11px] font-semibold text-slate-400">Class {st.className} • Roll #{st.rollNumber || 1}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {st.reasons.map((r, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold"
                    >
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* UPCOMING EXAMS & MARKS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upcoming Tests & Exams (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Tests & Exams</h2>
              <p className="text-xs text-slate-500">Evaluation schedules for your classes</p>
            </div>
            <button
              onClick={() => navigate('/teacher/exams')}
              className="text-xs font-bold text-[#FF6B2C] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-200 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-orange-100 text-[#FF6B2C] rounded-md text-[10px] font-black">
                      Class {exam.className}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{exam.subject} Assessment</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: <strong>{exam.date}</strong> • Max Marks: <strong>{exam.maxMarks}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/teacher/exams/${exam.id}/marks`)}
                    className="px-3.5 py-1.5 bg-[#FFF5F0] hover:bg-[#FF6B2C] text-[#FF6B2C] hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Enter Marks
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marks Status Overview (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Marks Evaluation Status</h2>
            <p className="text-xs text-slate-500">Assessment marks workflow status</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => navigate('/teacher/exams')}
              className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <span className="text-xs font-bold text-amber-800">Pending Marks</span>
              <h3 className="text-2xl font-black text-amber-900 mt-1">{marksOverview.pending}</h3>
              <p className="text-[10px] text-amber-700 mt-0.5">Click to enter marks</p>
            </div>

            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl">
              <span className="text-xs font-bold text-blue-800">Submitted</span>
              <h3 className="text-2xl font-black text-blue-900 mt-1">{marksOverview.submitted}</h3>
              <p className="text-[10px] text-blue-700 mt-0.5">Saved in database</p>
            </div>

            <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl">
              <span className="text-xs font-bold text-purple-800">Verified</span>
              <h3 className="text-2xl font-black text-purple-900 mt-1">{marksOverview.verified}</h3>
              <p className="text-[10px] text-purple-700 mt-0.5">Principal approved</p>
            </div>

            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
              <span className="text-xs font-bold text-emerald-800">Published</span>
              <h3 className="text-2xl font-black text-emerald-900 mt-1">{marksOverview.published}</h3>
              <p className="text-[10px] text-emerald-700 mt-0.5">Visible on report cards</p>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE HOMEWORK & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Active Homework (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Homework</h2>
              <p className="text-xs text-slate-500">Assignments currently assigned to your classes</p>
            </div>
            <button
              onClick={() => navigate('/teacher/homework')}
              className="text-xs font-bold text-[#FF6B2C] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {activeHomework.map((hw) => (
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
                    Due: <strong>{hw.dueDate}</strong> • {hw.submissionsCount}/{hw.totalStudents} submitted
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
        </div>

        {/* Recent Activity & Important Notices (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500">Your recent actions in the portal</p>
            </div>

            <div className="space-y-3 text-xs">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start justify-between gap-3 py-1">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-800 font-semibold">{act.text}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate(`/teacher/attendance?class=${selectedClass === 'ALL' ? '5-B' : selectedClass}`)}
                className="p-3 bg-slate-50 hover:bg-[#FFF5F0] hover:text-[#FF6B2C] border border-slate-200/80 rounded-2xl text-left text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => navigate('/teacher/homework')}
                className="p-3 bg-slate-50 hover:bg-[#FFF5F0] hover:text-[#FF6B2C] border border-slate-200/80 rounded-2xl text-left text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Assign Homework
              </button>
              <button
                onClick={() => navigate('/teacher/exams')}
                className="p-3 bg-slate-50 hover:bg-[#FFF5F0] hover:text-[#FF6B2C] border border-slate-200/80 rounded-2xl text-left text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Enter Marks
              </button>
              <button
                onClick={() => navigate('/teacher/timetable')}
                className="p-3 bg-slate-50 hover:bg-[#FFF5F0] hover:text-[#FF6B2C] border border-slate-200/80 rounded-2xl text-left text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                View Timetable
              </button>
              <button
                onClick={() => navigate('/teacher/communication')}
                className="p-3 bg-slate-50 hover:bg-[#FFF5F0] hover:text-[#FF6B2C] border border-slate-200/80 rounded-2xl text-left text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Message Parents
              </button>
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
    </div>
  );
};

export default TeacherDashboard;
