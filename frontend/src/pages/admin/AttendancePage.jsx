import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceFilters } from '@/components/attendance/AttendanceFilters';
import { AttendanceTrend } from '@/components/attendance/AttendanceTrend';
import { ClassAttendanceTable } from '@/components/attendance/ClassAttendanceTable';
import { LowAttendanceSection } from '@/components/attendance/LowAttendanceSection';
import { DailyAttendanceTable } from '@/components/attendance/DailyAttendanceTable';
import { WeeklyAttendanceTable } from '@/components/attendance/WeeklyAttendanceTable';
import { MonthlyAttendanceTable } from '@/components/attendance/MonthlyAttendanceTable';
import { MarkAttendanceModal } from '@/components/attendance/MarkAttendanceModal';
import { AsyncState } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { addDays, formatDate, parseIsoDate, todayIso } from '@/utils';
import { groupBy, summarizeRecords } from '@/components/attendance/attendanceMath';
import { useI18n } from '@/i18n/translate';

/** Monday of the week containing `iso`. */
const mondayOf = (iso) => addDays(iso, -((parseIsoDate(iso).getDay() + 6) % 7));

const lastDayOfMonth = (month) => {
  const [y, m] = month.split('-').map(Number);
  return `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
};

const WEEK_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const defaultFilters = (selectedClass = 'ALL') => {
  const today = todayIso();
  return {
    viewMode: 'daily',
    selectedDate: today,
    selectedWeek: mondayOf(today),
    selectedMonth: today.slice(0, 7),
    selectedClass,
    searchQuery: '',
  };
};

export const AttendancePage = () => {
  const { tx } = useI18n();
  const [searchParams] = useSearchParams();
  const [activeSidebarId, setActiveSidebarId] = useState('attendance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [filterState, setFilterState] = useState(() => defaultFilters(searchParams.get('class') || 'ALL'));
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleFilterChange = (key, value) => setFilterState((prev) => ({ ...prev, [key]: value }));
  const handleResetFilters = () => {
    setFilterState(defaultFilters());
    triggerToast('Filters reset to default state.');
  };

  const { viewMode, selectedDate, selectedWeek, selectedMonth, selectedClass, searchQuery } = filterState;

  // Daily and weekly views load the Monday–Saturday week; monthly loads the whole month.
  const range = useMemo(() => {
    if (viewMode === 'monthly') return { from: `${selectedMonth}-01`, to: lastDayOfMonth(selectedMonth) };
    const monday = viewMode === 'weekly' ? selectedWeek : mondayOf(selectedDate);
    return { from: monday, to: addDays(monday, 5) };
  }, [viewMode, selectedDate, selectedWeek, selectedMonth]);

  const weekDates = useMemo(() => WEEK_KEYS.map((_, i) => addDays(range.from, i)), [range.from]);

  const classes = useApi('/classes');
  const students = useApi('/students');
  const meta = useApi('/meta');
  const records = useApi(withQuery('/attendance', range));
  const threshold = meta.data?.lowAttendanceThreshold ?? 75;

  // Records of the shown period, limited to the selected class.
  const classRecords = useMemo(() => {
    const list = records.data || [];
    return selectedClass === 'ALL' ? list : list.filter((r) => r.className === selectedClass);
  }, [records.data, selectedClass]);
  const periodRecords = useMemo(
    () => (viewMode === 'daily' ? classRecords.filter((r) => r.date === selectedDate) : classRecords),
    [classRecords, viewMode, selectedDate],
  );

  // 1. Students in the selected class matching the search.
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (students.data || [])
      .filter((s) => selectedClass === 'ALL' || s.className === selectedClass)
      .filter(
        (s) => !q || s.name.toLowerCase().includes(q) || String(s.rollNumber).includes(q) || s.id.toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          a.className.localeCompare(b.className, undefined, { numeric: true }) || (a.rollNumber || 0) - (b.rollNumber || 0),
      );
  }, [students.data, selectedClass, searchQuery]);

  const recordsByStudent = useMemo(() => groupBy(periodRecords, (r) => r.studentId), [periodRecords]);

  // 2. Daily roster (one row per student).
  const dailyRoster = useMemo(
    () =>
      filteredStudents.map((student) => {
        const rec = (recordsByStudent.get(student.id) || [])[0];
        return {
          student,
          status: rec ? rec.status : null,
          checkInTime: rec?.checkInTime || '',
          remarks: rec?.remarks || '',
        };
      }),
    [filteredStudents, recordsByStudent],
  );

  // 3. Weekly roster (Mon–Sat status per student).
  const weeklyRoster = useMemo(
    () =>
      filteredStudents.map((student) => {
        const list = recordsByStudent.get(student.id) || [];
        const byDate = new Map(list.map((r) => [r.date, r.status]));
        const row = { student, rate: summarizeRecords(list).rate };
        WEEK_KEYS.forEach((key, i) => {
          row[key] = byDate.get(weekDates[i]) || null;
        });
        return row;
      }),
    [filteredStudents, recordsByStudent, weekDates],
  );

  // 4. Monthly roster (totals per student).
  const monthlyRoster = useMemo(
    () =>
      filteredStudents.map((student) => {
        const s = summarizeRecords(recordsByStudent.get(student.id) || []);
        return {
          student,
          presentDays: s.present,
          absentDays: s.absent,
          lateDays: s.late,
          leaveDays: s.leave,
          totalWorkingDays: s.workingDays,
          rate: s.rate,
        };
      }),
    [filteredStudents, recordsByStudent],
  );

  // 5. Summary cards — only records of the listed students count.
  const summary = useMemo(() => {
    const ids = new Set(filteredStudents.map((s) => s.id));
    const s = summarizeRecords(periodRecords.filter((r) => ids.has(r.studentId)));
    const notMarked = viewMode === 'daily' ? dailyRoster.filter((r) => !r.status).length : null;
    return {
      totalStudents: filteredStudents.length,
      present: s.present,
      absent: s.absent,
      late: s.late,
      leave: s.leave,
      notMarked,
      attendanceRate: s.rate,
    };
  }, [filteredStudents, periodRecords, viewMode, dailyRoster]);

  // Per-class comparison and low-attendance lists for the period (all classes).
  const classRows = useMemo(() => {
    const list = viewMode === 'daily' ? (records.data || []).filter((r) => r.date === selectedDate) : records.data || [];
    const byClass = groupBy(list, (r) => r.className);
    const studentCounts = new Map((classes.data || []).map((c) => [c.id, c.studentCount]));
    return (classes.data || [])
      .map((c) => {
        const s = summarizeRecords(byClass.get(c.id) || []);
        return {
          name: c.id,
          total: studentCounts.get(c.id) ?? 0,
          present: s.present + s.late,
          absent: s.absent,
          rate: s.rate,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [records.data, classes.data, viewMode, selectedDate]);

  const lowStudents = useMemo(() => {
    if (viewMode === 'daily') return [];
    const byStudent = groupBy(records.data || [], (r) => r.studentId);
    const studentMap = new Map((students.data || []).map((s) => [s.id, s]));
    return [...byStudent.entries()]
      .map(([id, list]) => ({ student: studentMap.get(id), rate: summarizeRecords(list).rate }))
      .filter((row) => row.student && row.rate !== null && row.rate < threshold)
      .filter((row) => selectedClass === 'ALL' || row.student.className === selectedClass)
      .sort((a, b) => a.rate - b.rate);
  }, [records.data, students.data, threshold, viewMode, selectedClass]);

  const lowClasses = classRows.filter((c) => c.rate !== null && c.rate < threshold);

  const periodLabel =
    viewMode === 'monthly'
      ? formatDate(`${selectedMonth}-01`).replace(/^1 /, '')
      : viewMode === 'weekly'
        ? `${formatDate(weekDates[0])} – ${formatDate(weekDates[5])}`
        : formatDate(selectedDate);

  const handleExportCSV = () => {
    const rows = [];
    const rateCell = (rate) => (rate === null || rate === undefined ? '' : rate);
    if (viewMode === 'daily') {
      rows.push('Student ID,Student Name,Class,Roll No,Date,Status,Check-in Time,Remarks');
      dailyRoster.forEach((r) =>
        rows.push(
          [r.student.id, `"${r.student.name}"`, r.student.className, r.student.rollNumber, selectedDate, r.status || 'not marked', r.checkInTime, `"${r.remarks}"`].join(','),
        ),
      );
    } else if (viewMode === 'weekly') {
      rows.push(`Student ID,Student Name,Class,Roll No,${weekDates.join(',')},Weekly Rate %`);
      weeklyRoster.forEach((r) =>
        rows.push(
          [r.student.id, `"${r.student.name}"`, r.student.className, r.student.rollNumber, ...WEEK_KEYS.map((k) => r[k] || ''), rateCell(r.rate)].join(','),
        ),
      );
    } else {
      rows.push('Student ID,Student Name,Class,Roll No,Present,Absent,Late,Leave,Working Days,Rate %');
      monthlyRoster.forEach((r) =>
        rows.push(
          [r.student.id, `"${r.student.name}"`, r.student.className, r.student.rollNumber, r.presentDays, r.absentDays, r.lateDays, r.leaveDays, r.totalWorkingDays, rateCell(r.rate)].join(','),
        ),
      );
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${viewMode}_${selectedClass}_${range.from}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Filtered attendance exported as CSV.');
  };

  const handleSaved = (message) => {
    triggerToast(message);
    records.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
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
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#FF6B2C] border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {tx('Attendance Management')}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                Track and manage daily student attendance at school, class, and student levels
              </p>
            </div>
          </div>

          <AttendanceFilters
            filterState={filterState}
            classOptions={(classes.data || []).map((c) => c.id).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onExportCSV={handleExportCSV}
            onOpenMarkModal={() => setIsMarkModalOpen(true)}
          />

          <AsyncState state={[students, records, classes]} loadingText="Loading attendance…">
            {() => (
              <>
                <AttendanceSummary summary={summary} />

                <AttendanceTrend
                  viewMode={viewMode}
                  records={classRecords}
                  weekDates={weekDates}
                  periodLabel={periodLabel}
                />

                {viewMode === 'daily' && <DailyAttendanceTable dailyData={dailyRoster} dateLabel={periodLabel} />}
                {viewMode === 'weekly' && (
                  <WeeklyAttendanceTable weeklyData={weeklyRoster} periodLabel={periodLabel} />
                )}
                {viewMode === 'monthly' && (
                  <MonthlyAttendanceTable monthlyData={monthlyRoster} periodLabel={periodLabel} />
                )}

                <ClassAttendanceTable
                  rows={classRows}
                  periodLabel={periodLabel}
                  selectedClass={selectedClass}
                  onSelectClass={(cls) => handleFilterChange('selectedClass', cls)}
                />

                <LowAttendanceSection
                  threshold={threshold}
                  periodLabel={periodLabel}
                  students={lowStudents}
                  classes={lowClasses}
                  showStudents={viewMode !== 'daily'}
                  onSelectClass={(cls) => handleFilterChange('selectedClass', cls)}
                />
              </>
            )}
          </AsyncState>
        </main>
      </div>

      {isMarkModalOpen && (
        <MarkAttendanceModal
          isOpen={isMarkModalOpen}
          classOptions={(classes.data || []).map((c) => c.id).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))}
          initialClass={selectedClass !== 'ALL' ? selectedClass : ''}
          initialDate={viewMode === 'daily' && selectedDate <= todayIso() ? selectedDate : todayIso()}
          onClose={() => setIsMarkModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default AttendancePage;
