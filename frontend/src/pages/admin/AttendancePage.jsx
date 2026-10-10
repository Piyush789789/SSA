import React, { useState, useMemo } from 'react';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  INITIAL_ATTENDANCE_RECORDS,
  ATTENDANCE_STUDENTS,
  CLASSES_LIST,
} from '@/data/attendanceData';

import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceFilters } from '@/components/attendance/AttendanceFilters';
import { AttendanceTrend } from '@/components/attendance/AttendanceTrend';
import { ClassAttendanceTable } from '@/components/attendance/ClassAttendanceTable';
import { LowAttendanceSection } from '@/components/attendance/LowAttendanceSection';
import { DailyAttendanceTable } from '@/components/attendance/DailyAttendanceTable';
import { WeeklyAttendanceTable } from '@/components/attendance/WeeklyAttendanceTable';
import { MonthlyAttendanceTable } from '@/components/attendance/MonthlyAttendanceTable';
import { MarkAttendanceModal } from '@/components/attendance/MarkAttendanceModal';

const DEFAULT_FILTER_STATE = {
  viewMode: 'daily',
  selectedDate: '2026-09-28',
  selectedWeek: '2026-W39',
  selectedMonth: '2026-09',
  selectedClass: 'ALL',
  searchQuery: '',
};

export const AttendancePage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('attendance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Raw Attendance Log Database State
  const [attendanceRecords, setAttendanceRecords] = useState(INITIAL_ATTENDANCE_RECORDS);

  // Centralized Filter State
  const [filterState, setFilterState] = useState(DEFAULT_FILTER_STATE);

  // Modal & Toast
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleFilterChange = (key, value) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilterState(DEFAULT_FILTER_STATE);
    triggerToast('Filters reset to default state.');
  };

  // 1. FILTER STUDENTS STEP (by Class and Search Query: Name, Roll Number, Student ID)
  const filteredStudents = useMemo(() => {
    return ATTENDANCE_STUDENTS.filter((student) => {
      // Class Filter
      if (filterState.selectedClass !== 'ALL') {
        if (student.className !== filterState.selectedClass) return false;
      }

      // Search Filter
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase().trim();
        const nameMatch = student.name.toLowerCase().includes(q);
        const rollMatch = String(student.rollNumber).includes(q);
        const idMatch = student.id.toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !idMatch) return false;
      }

      return true;
    });
  }, [filterState.selectedClass, filterState.searchQuery]);

  // 2. DAILY ROSTER COMPUTATION (ONE ROW PER STUDENT)
  const dailyRoster = useMemo(() => {
    const recordsMap = {};
    attendanceRecords.forEach((r) => {
      if (r.date === filterState.selectedDate) {
        recordsMap[r.studentId] = r;
      }
    });

    return filteredStudents.map((student) => {
      const rec = recordsMap[student.id];
      return {
        student,
        status: rec ? rec.status : 'Not Marked',
        checkInTime: rec ? rec.checkInTime : '—',
        remarks: rec ? rec.remarks : '',
      };
    });
  }, [filteredStudents, attendanceRecords, filterState.selectedDate]);

  // 3. WEEKLY ROSTER COMPUTATION (ONE ROW PER STUDENT WITH MON-SAT STATUS)
  const weeklyRoster = useMemo(() => {
    const weekDates = [
      '2026-09-21', // Mon
      '2026-09-22', // Tue
      '2026-09-23', // Wed
      '2026-09-24', // Thu
      '2026-09-25', // Fri
      '2026-09-26', // Sat
    ];

    return filteredStudents.map((student) => {
      const studentRecs = attendanceRecords.filter((r) => r.studentId === student.id);
      const getStatusForDate = (dt) => {
        const match = studentRecs.find((r) => r.date === dt);
        return match ? match.status : 'Not Marked';
      };

      const mon = getStatusForDate(weekDates[0]);
      const tue = getStatusForDate(weekDates[1]);
      const wed = getStatusForDate(weekDates[2]);
      const thu = getStatusForDate(weekDates[3]);
      const fri = getStatusForDate(weekDates[4]);
      const sat = getStatusForDate(weekDates[5]);

      const days = [mon, tue, wed, thu, fri, sat];
      const presentCount = days.filter((d) => d === 'present' || d === 'late').length;
      const applicableDays = days.filter((d) => d === 'present' || d === 'absent' || d === 'late').length || 6;
      const rate = ((presentCount / applicableDays) * 100).toFixed(1);

      return {
        student,
        mon,
        tue,
        wed,
        thu,
        fri,
        sat,
        rate,
      };
    });
  }, [filteredStudents, attendanceRecords]);

  // 4. MONTHLY ROSTER COMPUTATION (ONE ROW PER STUDENT WITH MONTHLY TOTALS)
  const monthlyRoster = useMemo(() => {
    return filteredStudents.map((student) => {
      const studentRecs = attendanceRecords.filter(
        (r) => r.studentId === student.id && r.date.startsWith(filterState.selectedMonth)
      );

      const presentDays = studentRecs.filter((r) => r.status === 'present').length;
      const lateDays = studentRecs.filter((r) => r.status === 'late').length;
      const absentDays = studentRecs.filter((r) => r.status === 'absent').length;
      const leaveDays = studentRecs.filter((r) => r.status === 'leave').length;
      const totalWorkingDays = studentRecs.filter((r) => r.status !== 'holiday').length || 24;

      const effectivePresent = presentDays + lateDays;
      const applicableWorking = effectivePresent + absentDays || 1;
      const rate = ((effectivePresent / applicableWorking) * 100).toFixed(1);

      return {
        student,
        presentDays: effectivePresent,
        absentDays,
        lateDays,
        leaveDays,
        totalWorkingDays,
        rate,
      };
    });
  }, [filteredStudents, attendanceRecords, filterState.selectedMonth]);

  // 5. DERIVED DYNAMIC SUMMARY CARDS
  const summary = useMemo(() => {
    let totalStudents = filteredStudents.length;
    if (filterState.selectedClass === 'ALL' && !filterState.searchQuery) {
      totalStudents = 1000;
    }

    if (filterState.viewMode === 'daily') {
      const present = dailyRoster.filter((r) => r.status === 'present' || r.status === 'late').length;
      const absent = dailyRoster.filter((r) => r.status === 'absent').length;
      const late = dailyRoster.filter((r) => r.status === 'late').length;
      const leave = dailyRoster.filter((r) => r.status === 'leave').length;
      const applicable = present + absent;
      const rate = applicable > 0 ? ((present / applicable) * 100).toFixed(1) : '91.2';
      return { totalStudents, present, absent, late, leave, attendanceRate: rate };
    }

    if (filterState.viewMode === 'weekly') {
      let totalP = 0, totalA = 0, totalL = 0, totalLV = 0;
      weeklyRoster.forEach((r) => {
        [r.mon, r.tue, r.wed, r.thu, r.fri, r.sat].forEach((st) => {
          if (st === 'present') totalP++;
          if (st === 'late') totalL++;
          if (st === 'absent') totalA++;
          if (st === 'leave') totalLV++;
        });
      });
      const effectiveP = totalP + totalL;
      const applicable = effectiveP + totalA;
      const rate = applicable > 0 ? ((effectiveP / applicable) * 100).toFixed(1) : '91.8';
      return { totalStudents, present: effectiveP, absent: totalA, late: totalL, leave: totalLV, attendanceRate: rate };
    }

    // Monthly Summary
    let totalP = 0, totalA = 0, totalL = 0, totalLV = 0;
    monthlyRoster.forEach((r) => {
      totalP += r.presentDays;
      totalA += r.absentDays;
      totalL += r.lateDays;
      totalLV += r.leaveDays;
    });
    const applicable = totalP + totalA;
    const rate = applicable > 0 ? ((totalP / applicable) * 100).toFixed(1) : '91.5';
    return { totalStudents, present: totalP, absent: totalA, late: totalL, leave: totalLV, attendanceRate: rate };
  }, [filterState.viewMode, filterState.selectedClass, filterState.searchQuery, filteredStudents, dailyRoster, weeklyRoster, monthlyRoster]);

  // EXPORT CSV HANDLER
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (filterState.viewMode === 'daily') {
      csvContent += 'Student ID,Student Name,Class,Roll No,Date,Status,Check-in Time\n';
      dailyRoster.forEach((r) => {
        const row = [
          r.student.id,
          `"${r.student.name}"`,
          r.student.className,
          r.student.rollNumber,
          filterState.selectedDate,
          r.status,
          r.checkInTime,
        ].join(',');
        csvContent += row + '\n';
      });
    } else if (filterState.viewMode === 'weekly') {
      csvContent += 'Student ID,Student Name,Class,Roll No,Mon,Tue,Wed,Thu,Fri,Sat,Weekly Rate %\n';
      weeklyRoster.forEach((r) => {
        const row = [
          r.student.id,
          `"${r.student.name}"`,
          r.student.className,
          r.student.rollNumber,
          r.mon,
          r.tue,
          r.wed,
          r.thu,
          r.fri,
          r.sat,
          r.rate,
        ].join(',');
        csvContent += row + '\n';
      });
    } else {
      csvContent += 'Student ID,Student Name,Class,Roll No,Present,Absent,Late,Leave,Working Days,Rate %\n';
      monthlyRoster.forEach((r) => {
        const row = [
          r.student.id,
          `"${r.student.name}"`,
          r.student.className,
          r.student.rollNumber,
          r.presentDays,
          r.absentDays,
          r.lateDays,
          r.leaveDays,
          r.totalWorkingDays,
          r.rate,
        ].join(',');
        csvContent += row + '\n';
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_${filterState.viewMode}_${filterState.selectedClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('Filtered attendance exported as CSV.');
  };

  // Add newly marked attendance records
  const handleSaveAttendance = (newRecords) => {
    setAttendanceRecords((prev) => [...newRecords, ...prev]);
    triggerToast('Class attendance saved successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Component */}
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          {/* Page Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#FF6B2C] border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Attendance Management
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                Track and manage student attendance at school, class, and student levels
              </p>
            </div>
          </div>

          {/* Centralized Top Filters */}
          <AttendanceFilters
            filterState={filterState}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onExportCSV={handleExportCSV}
            onOpenMarkModal={() => setIsMarkModalOpen(true)}
          />

          {/* Summary Cards */}
          <AttendanceSummary summary={summary} />

          {/* Attendance Trend Chart */}
          <AttendanceTrend viewMode={filterState.viewMode} />

          {/* Main Attendance Roster Table based on View Mode */}
          {filterState.viewMode === 'daily' && (
            <DailyAttendanceTable dailyData={dailyRoster} />
          )}

          {filterState.viewMode === 'weekly' && (
            <WeeklyAttendanceTable weeklyData={weeklyRoster} />
          )}

          {filterState.viewMode === 'monthly' && (
            <MonthlyAttendanceTable monthlyData={monthlyRoster} />
          )}

          {/* Class-wise Comparison Summary Table */}
          <ClassAttendanceTable
            selectedClass={filterState.selectedClass}
            onSelectClass={(cls) => handleFilterChange('selectedClass', cls)}
          />

          {/* Low Attendance Alert Section */}
          <LowAttendanceSection
            threshold={75}
            onSelectClass={(cls) => handleFilterChange('selectedClass', cls)}
          />
        </main>
      </div>

      {/* Mark Attendance Modal */}
      <MarkAttendanceModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        onSaveAttendance={handleSaveAttendance}
        hasPermission={true}
      />
    </div>
  );
};

export default AttendancePage;
