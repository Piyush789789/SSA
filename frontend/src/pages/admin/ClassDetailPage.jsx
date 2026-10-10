import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  DollarSign,
  Award,
  Calendar,
  FileCheck,
  UserCheck,
  Plus,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AsyncState, EmptyMessage, ErrorMessage, LoadingMessage } from '@/components/common/AsyncState';
import { NotFoundCard } from '@/components/students/NotFoundCard';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { addDays, formatCurrency, formatDate, todayIso } from '@/utils';
import { formatRate, groupBy, summarizeRecords } from '@/components/attendance/attendanceMath';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/i18n/translate';

const TABS = [
  'Overview',
  'Students',
  'Attendance',
  'Fees',
  'Academics',
  'Exams & Results',
  'Teachers & Subjects',
  'Timetable',
  'Homework',
  'Achievements',
];

const ATTENDANCE_DAYS = 30;
const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const StatTile = ({ label, value, labelClass = 'text-slate-400', valueClass = 'text-slate-900' }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
    <p className={`text-[10px] font-bold uppercase ${labelClass}`}>{label}</p>
    <h3 className={`text-xl font-black mt-1 ${valueClass}`}>{value}</h3>
  </div>
);

const Panel = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs ${className}`}>{children}</div>
);

/** Summary of GET /results/exams/{id}?className= rows. */
const summarizeResults = (rows = []) => {
  if (!rows.length) return null;
  const percentages = rows.map((r) => Number(r.percentage || 0));
  const top = [...rows].sort((a, b) => Number(b.percentage) - Number(a.percentage))[0];
  return {
    average: Math.round((percentages.reduce((a, b) => a + b, 0) / rows.length) * 10) / 10,
    passRate: Math.round((rows.filter((r) => r.passedAll).length * 1000) / rows.length) / 10,
    highest: Math.max(...percentages),
    lowest: Math.min(...percentages),
    top,
  };
};

export const ClassDetailPage = () => {
  const { tx } = useI18n();
  const { classId } = useParams();
  const navigate = useNavigate();

  const [activeSidebarId, setActiveSidebarId] = useState('classes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [chosenExamId, setChosenExamId] = useState('');
  const [today] = useState(todayIso);

  const id = encodeURIComponent(classId);
  const classState = useApi(`/classes/${id}`);
  const cls = classState.data;
  const ready = Boolean(cls);

  const students = useApi(ready ? `/classes/${id}/students` : null);
  const todaySummary = useApi(ready ? withQuery('/attendance/summary', { className: classId }) : null);
  const attendance = useApi(
    ready ? withQuery('/attendance', { className: classId, from: addDays(today, -(ATTENDANCE_DAYS - 1)), to: today }) : null,
  );
  const feeOverview = useApi(ready ? withQuery('/fees/overview', { className: classId }) : null);
  const teachers = useApi(ready ? '/teachers' : null);
  const daySchedule = useApi(ready ? withQuery('/timetable/day', { className: classId }) : null);
  const weekEntries = useApi(ready ? withQuery('/timetable', { className: classId }) : null);
  const exams = useApi(ready ? '/exams' : null);
  const homework = useApi(ready ? withQuery('/homework', { className: classId }) : null);

  const classExams = useMemo(
    () =>
      (exams.data || [])
        .filter((e) => (e.classes || []).includes(classId))
        .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))),
    [exams.data, classId],
  );
  const upcomingExams = classExams.filter((e) => e.status === 'Upcoming');
  // Default exam for results: the most recent one that has started.
  const defaultExam = classExams.find((e) => e.status !== 'Upcoming') || null;
  const selectedExamId = chosenExamId || defaultExam?.id || '';
  const selectedExam = classExams.find((e) => e.id === selectedExamId) || null;
  const results = useApi(selectedExamId ? withQuery(`/results/exams/${encodeURIComponent(selectedExamId)}`, { className: classId }) : null);
  const resultSummary = useMemo(() => summarizeResults(results.data || []), [results.data]);

  const today0 = todaySummary.data?.[0] || null;
  const attendanceSummary = useMemo(() => summarizeRecords(attendance.data || []), [attendance.data]);
  const rateByStudent = useMemo(() => {
    const grouped = groupBy(attendance.data || [], (r) => r.studentId);
    const map = new Map();
    grouped.forEach((list, sid) => map.set(sid, summarizeRecords(list).rate));
    return map;
  }, [attendance.data]);

  const classTeachers = useMemo(
    () => (teachers.data || []).filter((t) => (t.assignedClasses || []).includes(classId)),
    [teachers.data, classId],
  );

  // Subjects each teacher actually teaches this class, from the timetable.
  const subjectsByTeacher = useMemo(() => {
    const map = new Map();
    (weekEntries.data || []).forEach((e) => {
      if (!map.has(e.teacherId)) map.set(e.teacherId, new Set());
      map.get(e.teacherId).add(e.subject);
    });
    return map;
  }, [weekEntries.data]);

  const filteredClassStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (students.data || []).filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || String(s.rollNumber).includes(q),
    );
  }, [students.data, searchQuery]);

  const activeHomework = (homework.data || []).filter((h) => h.dueDate >= today);
  const fees = feeOverview.data;
  const feePercent = fees && fees.expected - fees.concessions > 0
    ? Math.round((fees.collected * 100) / (fees.expected - fees.concessions))
    : null;

  const rateText = (rate) => (rate === null || rate === undefined ? '—' : `${Math.round(rate)}%`);
  const val = (state, render) => (state.data != null ? render(state.data) : state.error ? '—' : '…');

  const renderTodayTimetable = () => (
    <AsyncState state={daySchedule}>
      {(slots) =>
        slots.length === 0 ? (
          <EmptyMessage text="No classes today." />
        ) : (
          <div className="space-y-2.5">
            {slots.map((slot) => (
              <div
                key={slot.periodId}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  slot.type === 'break' ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">
                    {slot.label} · {slot.startTime} – {slot.endTime}
                  </span>
                  <h4 className="font-bold text-slate-900">
                    {slot.type === 'break' ? slot.label : slot.subject || 'Free period'}
                  </h4>
                </div>
                <span className="text-[11px] font-medium text-slate-500">{slot.teacherName || ''}</span>
              </div>
            ))}
          </div>
        )
      }
    </AsyncState>
  );

  const renderTeachers = (compact) => (
    <AsyncState state={[teachers, weekEntries]}>
      {() =>
        classTeachers.length === 0 ? (
          <EmptyMessage text="No teachers are assigned to this class." />
        ) : (
          <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
            {classTeachers.map((t) => {
              const taught = [...(subjectsByTeacher.get(t.id) || [])];
              return (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900">{t.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {taught.length ? taught.join(', ') : (t.subjects || []).join(', ') || 'No subjects'}
                    </p>
                  </div>
                  {cls.classTeacherId === t.id && (
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B2C] text-[10px] font-extrabold border border-orange-200 shrink-0">
                      Class Teacher
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </AsyncState>
  );

  const renderExamSelect = () =>
    classExams.length > 0 && (
      <select
        value={selectedExamId}
        onChange={(e) => setChosenExamId(e.target.value)}
        className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
      >
        {classExams.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} ({e.status})
          </option>
        ))}
      </select>
    );

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          <button
            type="button"
            onClick={() => navigate('/admin/classes')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#FF6B2C] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {tx('Back to Classes Overview')}
          </button>

          {classState.error?.status === 404 ? (
            <NotFoundCard
              title="Class not found"
              message={`There is no class "${classId}".`}
              backLabel="Back to Classes"
              onBack={() => navigate('/admin/classes')}
            />
          ) : classState.error && !cls ? (
            <ErrorMessage error={classState.error} onRetry={classState.reload} />
          ) : !cls ? (
            <LoadingMessage text="Loading class…" />
          ) : (
            <>
              {/* Class Header Banner */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#FF6B2C] font-black text-xl flex items-center justify-center shrink-0 border border-orange-200">
                    {cls.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">{tx('Class')} {cls.id}</h1>
                      <span className="px-3 py-1 rounded-full bg-orange-50 text-[#FF6B2C] font-extrabold text-xs border border-orange-100">
                        Section {cls.section}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      Class Teacher:{' '}
                      <span className="text-slate-800 font-bold">{cls.classTeacherName || 'Not assigned'}</span> • Academic Year:{' '}
                      <span className="text-slate-800 font-bold">{cls.academicYear || '—'}</span> • Classroom:{' '}
                      <span className="text-slate-800 font-bold">{cls.room || '—'}</span> •{' '}
                      <span className="text-emerald-600 font-bold">{cls.studentCount ?? 0} Students</span>
                    </p>
                  </div>
                </div>

                {/* Quick Actions (Pre-selected for THIS CLASS) */}
                <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                  <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.ADMIN_ADD_STUDENT}?class=${cls.id}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF6B2C]" />
                    <span>Add Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/attendance?class=${cls.id}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark Attendance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.FEES}?class=${cls.id}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                    <span>Collect Fee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/timetable?class=${cls.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-[#FF6B2C]/20"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View Timetable</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-slate-200 overflow-x-auto custom-scrollbar">
                <nav className="flex space-x-6 min-w-max" aria-label="Tabs">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-xs font-bold capitalize transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-[#FF6B2C] text-[#FF6B2C]'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {tx(tab)}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="space-y-6">
                {/* OVERVIEW TAB */}
                {activeTab === 'Overview' && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <StatTile label="Students" value={cls.studentCount ?? 0} />
                      <StatTile
                        label="Today's Attendance"
                        labelClass="text-emerald-700"
                        valueClass="text-emerald-700"
                        value={val(todaySummary, () =>
                          today0 && today0.notMarked < today0.totalStudents
                            ? `${today0.present + today0.late} / ${today0.totalStudents}`
                            : 'Not marked',
                        )}
                      />
                      <StatTile
                        label={`Attendance (${ATTENDANCE_DAYS}d)`}
                        valueClass="text-[#FF6B2C]"
                        value={val(attendance, () => formatRate(attendanceSummary.rate))}
                      />
                      <StatTile label="Fees Collected" value={val(feeOverview, (f) => formatCurrency(f.collected))} />
                      <StatTile
                        label="Pending Fees"
                        labelClass="text-amber-700"
                        valueClass="text-amber-700"
                        value={val(feeOverview, (f) => formatCurrency(f.pending))}
                      />
                      <StatTile
                        label="Average Result"
                        labelClass="text-indigo-700"
                        valueClass="text-indigo-700"
                        value={selectedExamId ? val(results, () => (resultSummary ? `${resultSummary.average}%` : '—')) : '—'}
                      />
                    </div>

                    {/* Class Health Snapshot Indicators */}
                    <Panel className="!p-5">
                      <h3 className="font-extrabold text-slate-900 text-sm mb-3">Class Health &amp; Performance Indicators</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                          <p className="text-[10px] font-bold text-emerald-800 uppercase">ACADEMIC</p>
                          <h4 className="font-black text-emerald-800 text-xs mt-0.5">
                            {resultSummary ? `${resultSummary.average}% avg · ${selectedExam?.name}` : 'No results yet'}
                          </h4>
                        </div>
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                          <p className="text-[10px] font-bold text-emerald-800 uppercase">ATTENDANCE</p>
                          <h4 className="font-black text-emerald-800 text-xs mt-0.5">
                            {formatRate(attendanceSummary.rate)} (last {ATTENDANCE_DAYS} days)
                          </h4>
                        </div>
                        <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
                          <p className="text-[10px] font-bold text-amber-800 uppercase">FEES</p>
                          <h4 className="font-black text-amber-800 text-xs mt-0.5">
                            {feePercent === null ? '—' : `${feePercent}% Collected`}
                          </h4>
                        </div>
                        <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-2xl">
                          <p className="text-[10px] font-bold text-indigo-800 uppercase">HOMEWORK</p>
                          <h4 className="font-black text-indigo-800 text-xs mt-0.5">
                            {homework.data ? `${activeHomework.length} active` : '—'}
                          </h4>
                        </div>
                        <div className="p-3 bg-orange-50/70 border border-orange-200/60 rounded-2xl">
                          <p className="text-[10px] font-bold text-orange-800 uppercase">EXAMS</p>
                          <h4 className="font-black text-orange-800 text-xs mt-0.5">
                            {exams.data ? `${upcomingExams.length} Upcoming` : '—'}
                          </h4>
                        </div>
                      </div>
                    </Panel>

                    {/* Class Students Preview */}
                    <Panel className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-[#FF6B2C]" />
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            Class Roster ({students.data ? students.data.length : '…'} Students)
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('Students')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B2C] hover:underline"
                        >
                          View All Students <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <AsyncState state={students}>
                        {(list) =>
                          list.length === 0 ? (
                            <EmptyMessage text="No students in this class yet." />
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                    <th className="py-2.5 px-3">Student</th>
                                    <th className="py-2.5 px-3">Student ID</th>
                                    <th className="py-2.5 px-3">Roll No</th>
                                    <th className="py-2.5 px-3">Attendance ({ATTENDANCE_DAYS}d)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-semibold">
                                  {list.slice(0, 5).map((s) => (
                                    <tr
                                      key={s.id}
                                      onClick={() => navigate(`/admin/students/${s.id}`)}
                                      className="hover:bg-slate-50 cursor-pointer"
                                    >
                                      <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                                      <td className="py-3 px-3 text-slate-500">{s.id}</td>
                                      <td className="py-3 px-3 text-slate-600">{s.rollNumber}</td>
                                      <td className="py-3 px-3 text-emerald-600 font-bold">
                                        {attendance.data ? rateText(rateByStudent.get(s.id)) : '…'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                        }
                      </AsyncState>
                    </Panel>

                    {/* Subject Teachers & Today's Timetable */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Panel className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <h3 className="font-extrabold text-slate-900 text-sm">Assigned Teachers</h3>
                          <span className="text-xs text-slate-400">
                            {teachers.data ? `${classTeachers.length} Teachers` : ''}
                          </span>
                        </div>
                        {renderTeachers(true)}
                      </Panel>

                      <Panel className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <h3 className="font-extrabold text-slate-900 text-sm">Today's Timetable</h3>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/timetable?class=${cls.id}`)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B2C] hover:underline"
                          >
                            View Full Timetable <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {renderTodayTimetable()}
                      </Panel>
                    </div>
                  </>
                )}

                {/* STUDENTS TAB */}
                {activeTab === 'Students' && (
                  <Panel className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search student by name, roll no or student ID..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.ADMIN_STUDENTS}?class=${cls.id}`)}
                        className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs shrink-0 cursor-pointer"
                      >
                        View All Students Module
                      </button>
                    </div>

                    <AsyncState state={students}>
                      {() => (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                <th className="py-2.5 px-3">Student Name</th>
                                <th className="py-2.5 px-3">Student ID</th>
                                <th className="py-2.5 px-3">Roll No</th>
                                <th className="py-2.5 px-3">Email</th>
                                <th className="py-2.5 px-3">Attendance ({ATTENDANCE_DAYS}d)</th>
                                <th className="py-2.5 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold">
                              {filteredClassStudents.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="text-center py-6 text-slate-400">
                                    No students match the search criteria.
                                  </td>
                                </tr>
                              ) : (
                                filteredClassStudents.map((s) => (
                                  <tr key={s.id} className="hover:bg-slate-50">
                                    <td
                                      className="py-3 px-3 font-bold text-slate-900 cursor-pointer hover:text-[#FF6B2C]"
                                      onClick={() => navigate(`/admin/students/${s.id}`)}
                                    >
                                      {s.name}
                                    </td>
                                    <td className="py-3 px-3 text-slate-500">{s.id}</td>
                                    <td className="py-3 px-3 text-slate-600">{s.rollNumber}</td>
                                    <td className="py-3 px-3 text-slate-500 font-normal">{s.email || '—'}</td>
                                    <td className="py-3 px-3 text-emerald-600 font-bold">
                                      {attendance.data ? rateText(rateByStudent.get(s.id)) : '…'}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/admin/attendance/student/${s.id}`)}
                                        className="text-[11px] font-bold text-[#FF6B2C] hover:underline"
                                      >
                                        View Attendance
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </AsyncState>
                  </Panel>
                )}

                {/* ATTENDANCE TAB */}
                {activeTab === 'Attendance' && (
                  <Panel className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Class Attendance Breakdown</h3>
                        <p className="text-xs text-slate-400">Today ({formatDate(today)}) for Class {cls.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/attendance?class=${cls.id}`)}
                        className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer"
                      >
                        View Full Attendance Module
                      </button>
                    </div>
                    <AsyncState state={todaySummary}>
                      {() =>
                        !today0 ? (
                          <EmptyMessage text="No attendance data for today." />
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-800">Present Today</p>
                              <h4 className="text-xl font-black text-emerald-800 mt-1">{today0.present}</h4>
                            </div>
                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                              <p className="text-xs font-bold text-rose-800">Absent Today</p>
                              <h4 className="text-xl font-black text-rose-800 mt-1">{today0.absent}</h4>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                              <p className="text-xs font-bold text-amber-800">Late Today</p>
                              <h4 className="text-xl font-black text-amber-800 mt-1">{today0.late}</h4>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-xs font-bold text-slate-600">Not Marked</p>
                              <h4 className="text-xl font-black text-slate-700 mt-1">{today0.notMarked}</h4>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                              <p className="text-xs font-bold text-orange-800">Rate Today</p>
                              <h4 className="text-xl font-black text-[#FF6B2C] mt-1">{formatRate(today0.rate)}</h4>
                            </div>
                          </div>
                        )
                      }
                    </AsyncState>
                    <p className="text-xs text-slate-500">
                      Last {ATTENDANCE_DAYS} days: {formatRate(attendanceSummary.rate)} attendance rate over{' '}
                      {attendanceSummary.workingDays} marked student-days.
                    </p>
                  </Panel>
                )}

                {/* FEES TAB */}
                {activeTab === 'Fees' && (
                  <Panel className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Class Fee Collection Overview</h3>
                        <p className="text-xs text-slate-400">Financial summary for Class {cls.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.FEES}?class=${cls.id}`)}
                        className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer"
                      >
                        Manage Class Fees Module
                      </button>
                    </div>
                    <AsyncState state={feeOverview}>
                      {(f) => (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-500">Total Expected</p>
                            <h4 className="text-xl font-black text-slate-900 mt-1">{formatCurrency(f.expected)}</h4>
                            {f.concessions > 0 && (
                              <p className="text-[11px] text-slate-500 mt-1">Concessions: {formatCurrency(f.concessions)}</p>
                            )}
                          </div>
                          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-800">Total Collected</p>
                            <h4 className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(f.collected)}</h4>
                          </div>
                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <p className="text-xs font-bold text-amber-800">Total Pending</p>
                            <h4 className="text-xl font-black text-amber-800 mt-1">{formatCurrency(f.pending)}</h4>
                          </div>
                          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-xs font-bold text-rose-800">Overdue</p>
                            <h4 className="text-xl font-black text-rose-800 mt-1">{formatCurrency(f.overdue)}</h4>
                            <p className="text-[11px] text-rose-700 mt-1">{f.studentsWithDues} students with dues</p>
                          </div>
                        </div>
                      )}
                    </AsyncState>
                  </Panel>
                )}

                {/* ACADEMICS TAB */}
                {activeTab === 'Academics' && (
                  <Panel className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="font-extrabold text-slate-900 text-base">Academic Performance &amp; Rankings</h3>
                      {renderExamSelect()}
                    </div>
                    {!selectedExamId ? (
                      <EmptyMessage text="No exams have been held for this class yet." />
                    ) : (
                      <AsyncState state={results}>
                        {(rows) =>
                          !resultSummary ? (
                            <EmptyMessage text="No marks entered for this exam yet." />
                          ) : (
                            <>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-xs font-bold text-slate-500">Average Result</p>
                                  <h4 className="text-xl font-black text-slate-900 mt-1">{resultSummary.average}%</h4>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                  <p className="text-xs font-bold text-emerald-800">Pass Percentage</p>
                                  <h4 className="text-xl font-black text-emerald-800 mt-1">{resultSummary.passRate}%</h4>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                  <p className="text-xs font-bold text-indigo-800">Highest</p>
                                  <h4 className="text-xl font-black text-indigo-800 mt-1">{resultSummary.highest}%</h4>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                  <p className="text-xs font-bold text-amber-800">Lowest</p>
                                  <h4 className="text-xl font-black text-amber-800 mt-1">{resultSummary.lowest}%</h4>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                      <th className="py-2.5 px-3">Rank</th>
                                      <th className="py-2.5 px-3">Student</th>
                                      <th className="py-2.5 px-3">Marks</th>
                                      <th className="py-2.5 px-3">Percentage</th>
                                      <th className="py-2.5 px-3">Grade</th>
                                      <th className="py-2.5 px-3">Result</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-semibold">
                                    {rows.map((r) => (
                                      <tr key={r.studentId} className="hover:bg-slate-50">
                                        <td className="py-3 px-3 text-slate-900 font-black">{r.rank}</td>
                                        <td className="py-3 px-3 text-slate-900">{r.studentName}</td>
                                        <td className="py-3 px-3 text-slate-600">
                                          {r.totalObtained} / {r.totalMaxMarks}
                                        </td>
                                        <td className="py-3 px-3 text-slate-700">{r.percentage}%</td>
                                        <td className="py-3 px-3 text-slate-700">{r.grade}</td>
                                        <td className="py-3 px-3">
                                          {r.passedAll ? (
                                            <span className="text-emerald-600 font-bold">Pass</span>
                                          ) : (
                                            <span className="text-rose-600 font-bold">Fail</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )
                        }
                      </AsyncState>
                    )}
                  </Panel>
                )}

                {/* EXAMS & RESULTS TAB */}
                {activeTab === 'Exams & Results' && (
                  <Panel className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Class Exams, Results &amp; Report Cards</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Examinations scheduled for Class {cls.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.ADMIN_EXAMS)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4" />
                        Open Exams &amp; Results Module
                      </button>
                    </div>

                    <AsyncState state={exams}>
                      {() => (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-xs font-bold text-slate-500 uppercase">Upcoming Exam</p>
                              <h4 className="text-base font-extrabold text-slate-900 mt-1">
                                {upcomingExams.length
                                  ? `${upcomingExams[upcomingExams.length - 1].name} (${formatDate(upcomingExams[upcomingExams.length - 1].startDate)})`
                                  : 'None'}
                              </h4>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-800 uppercase">Pass Rate</p>
                              <h4 className="text-xl font-black text-emerald-800 mt-1">
                                {resultSummary ? `${resultSummary.passRate}%` : '—'}
                              </h4>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                              <p className="text-xs font-bold text-indigo-800 uppercase">Class Average</p>
                              <h4 className="text-xl font-black text-indigo-800 mt-1">
                                {resultSummary ? `${resultSummary.average}%` : '—'}
                              </h4>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                              <p className="text-xs font-bold text-amber-800 uppercase">Top Performer</p>
                              <h4 className="text-base font-extrabold text-amber-900 mt-1">
                                {resultSummary ? `${resultSummary.top.studentName} (${resultSummary.top.percentage}%)` : '—'}
                              </h4>
                            </div>
                          </div>
                          {selectedExam && (
                            <p className="text-[11px] text-slate-400">Results above are for {selectedExam.name}.</p>
                          )}

                          {classExams.length === 0 ? (
                            <EmptyMessage text="No exams are scheduled for this class." />
                          ) : (
                            <div className="space-y-2.5">
                              {classExams.map((exam) => (
                                <div
                                  key={exam.id}
                                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <FileCheck className="w-5 h-5 text-[#FF6B2C] shrink-0" />
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-xs text-slate-900 truncate">{exam.name}</h4>
                                      <p className="text-xs text-slate-500">
                                        {formatDate(exam.startDate)} – {formatDate(exam.endDate)} • {exam.status} • Results{' '}
                                        {exam.resultsStatus}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/admin/exams/${exam.id}`)}
                                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                                  >
                                    Open Exam
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </AsyncState>
                  </Panel>
                )}

                {/* TEACHERS & SUBJECTS TAB */}
                {activeTab === 'Teachers & Subjects' && (
                  <Panel className="space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base">Assigned Subject Teachers</h3>
                    {renderTeachers(false)}
                  </Panel>
                )}

                {/* TIMETABLE TAB */}
                {activeTab === 'Timetable' && (
                  <Panel className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-extrabold text-slate-900 text-base">Today's Class Timetable</h3>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/timetable?class=${cls.id}`)}
                        className="px-4 py-2 bg-[#FF6B2C] text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer"
                      >
                        View Full Timetable Module
                      </button>
                    </div>
                    {renderTodayTimetable()}
                    <AsyncState state={weekEntries}>
                      {(entries) => (
                        <p className="text-xs text-slate-500">
                          {entries.length} periods scheduled across the week (
                          {DAY_ORDER.filter((d) => entries.some((e) => e.day === d)).length} days).
                        </p>
                      )}
                    </AsyncState>
                  </Panel>
                )}

                {/* HOMEWORK TAB */}
                {activeTab === 'Homework' && (
                  <Panel className="space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base">Assigned Class Homework</h3>
                    <AsyncState state={homework}>
                      {(list) =>
                        list.length === 0 ? (
                          <EmptyMessage text="No homework assigned to this class." />
                        ) : (
                          [...list]
                            .sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)))
                            .map((hw) => (
                              <div
                                key={hw.id}
                                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="min-w-0">
                                  <h4 className="font-bold text-slate-900">{hw.title}</h4>
                                  <p className="text-slate-500">
                                    {hw.subject} • {hw.teacherName} • Due: {formatDate(hw.dueDate)}
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full font-extrabold text-xs shrink-0 ${
                                    hw.dueDate >= today ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {hw.dueDate >= today ? 'Active' : 'Past due'}
                                </span>
                              </div>
                            ))
                        )
                      }
                    </AsyncState>
                  </Panel>
                )}

                {/* ACHIEVEMENTS TAB */}
                {activeTab === 'Achievements' && (
                  <Panel className="space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base">Class Achievements &amp; Accolades</h3>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-xs text-slate-500">
                      <Award className="w-5 h-5 text-slate-400 shrink-0" />
                      Not available yet — the server does not record class achievements.
                    </div>
                  </Panel>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClassDetailPage;
