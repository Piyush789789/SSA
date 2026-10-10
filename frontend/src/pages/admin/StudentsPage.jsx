import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StudentFilters } from '@/components/students/StudentFilters';
import { StudentTable } from '@/components/students/StudentTable';
import { AsyncState, ErrorMessage } from '@/components/common/AsyncState';
import { useApi } from '@/hooks/useApi';
import { http, withQuery } from '@/api/http';
import { addDays, todayIso } from '@/utils';
import { groupBy, summarizeRecords } from '@/components/attendance/attendanceMath';
import { ROUTES } from '@/constants/routes';

const ATTENDANCE_DAYS = 30;

/** 'paid' | 'pending' | 'overdue' | 'none' from a student's fee dues. */
const feeStatusOf = (dues) => {
  if (!dues || dues.length === 0) return 'none';
  if (dues.some((d) => d.status === 'Overdue')) return 'overdue';
  if (dues.some((d) => Number(d.pending) > 0)) return 'pending';
  return 'paid';
};

export const StudentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSidebarId, setActiveSidebarId] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const queryParam = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(queryParam);
  // The header search can change ?q= while this page is open.
  const [lastQueryParam, setLastQueryParam] = useState(queryParam);
  if (queryParam !== lastQueryParam) {
    setLastQueryParam(queryParam);
    setSearchTerm(queryParam);
  }
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || 'All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [actionError, setActionError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [today] = useState(todayIso);
  const students = useApi(withQuery('/students', { className: selectedClass === 'All' ? '' : selectedClass }));
  const classes = useApi('/classes');
  const dues = useApi('/fees/dues');
  const attendance = useApi(withQuery('/attendance', { from: addDays(today, -(ATTENDANCE_DAYS - 1)), to: today }));

  // Fee status and recent attendance rate per student.
  const enriched = useMemo(() => {
    if (!students.data) return [];
    const duesByStudent = groupBy(dues.data || [], (d) => d.studentId);
    const attendanceByStudent = groupBy(attendance.data || [], (r) => r.studentId);
    return students.data.map((s) => ({
      ...s,
      feeStatus: dues.data ? feeStatusOf(duesByStudent.get(s.id)) : null,
      attendance: attendance.data ? summarizeRecords(attendanceByStudent.get(s.id)).rate : undefined,
    }));
  }, [students.data, dues.data, attendance.data]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return enriched.filter((student) => {
      const matchesSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        String(student.rollNumber).includes(q) ||
        student.id.toLowerCase().includes(q);
      const matchesStatus = selectedStatus === 'All' || student.feeStatus === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [enriched, searchTerm, selectedStatus]);

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.name} (${student.id})? This removes the student record permanently.`)) {
      return;
    }
    setActionError(null);
    try {
      await http.delete(`/students/${student.id}`);
      setToastMessage(`${student.name} was deleted.`);
      setTimeout(() => setToastMessage(''), 3000);
      students.reload();
      dues.reload();
    } catch (error) {
      setActionError(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm">{toastMessage}</span>
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
        {/* Header */}
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Students Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-12">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Students
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                {students.data
                  ? `${filteredStudents.length} of ${students.data.length} students shown. Attendance is for the last ${ATTENDANCE_DAYS} days.`
                  : 'Loading students…'}
              </p>
            </div>

            {/* Add Student Primary Action Button */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN_ADD_STUDENT)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Student</span>
            </button>
          </div>

          {/* Filter Toolbar */}
          <StudentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedClass={selectedClass}
            onClassChange={setSelectedClass}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            classOptions={(classes.data || []).map((c) => c.id)}
          />

          {actionError && <ErrorMessage error={actionError} />}
          {dues.error && !dues.data && (
            <ErrorMessage error={{ message: `Fee status unavailable: ${dues.error.message}` }} onRetry={dues.reload} />
          )}
          {attendance.error && !attendance.data && (
            <ErrorMessage
              error={{ message: `Attendance unavailable: ${attendance.error.message}` }}
              onRetry={attendance.reload}
            />
          )}

          {/* Students Table */}
          <AsyncState state={students} loadingText="Loading students…">
            {() => <StudentTable students={filteredStudents} onDelete={handleDelete} />}
          </AsyncState>
        </main>
      </div>
    </div>
  );
};

export default StudentsPage;
