import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileCheck,
  Award,
  TrendingUp,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate, todayIso } from '@/utils';
import { AdmitCardLinks } from '@/components/exams/AdmitCardLinks';
import { useI18n } from '@/i18n/translate';
import { aggregateBySubject, gradeFor, groupByExam } from './resultsUtils';

export const StudentExamsPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();

  const studentId = currentUser?.studentId || currentUser?.id;
  const className = currentUser?.className;

  const urlFilter = searchParams.get('filter');
  const [activeTab, setActiveTab] = useState(urlFilter?.toLowerCase() === 'upcoming' ? 'UPCOMING' : 'COMPLETED');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExamIds, setExpandedExamIds] = useState(() => new Set());

  const results = useApi(studentId ? `/results/students/${studentId}` : null);
  const schedules = useApi(className ? withQuery('/exam-schedules', { className }) : null);
  const exams = useApi('/exams');
  const meta = useApi('/meta');

  const gradeBands = meta.data?.gradeBands;

  const toggleExpand = (id) => {
    setExpandedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedExams = useMemo(() => groupByExam(results.data?.subjects), [results.data]);
  const subjectPerformance = useMemo(() => aggregateBySubject(results.data?.subjects), [results.data]);

  const upcomingPapers = useMemo(() => {
    const today = todayIso();
    const examNames = new Map((exams.data || []).map((e) => [e.id, e.name]));
    return (schedules.data || [])
      .filter((p) => p.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
      .map((p) => ({ ...p, examName: examNames.get(p.examId) || 'Exam' }));
  }, [schedules.data, exams.data]);

  const examStats = useMemo(() => {
    const best = completedExams.reduce(
      (top, exam) => (exam.percentage != null && (top == null || exam.percentage > top.percentage) ? exam : top),
      null,
    );
    const bestSubject = subjectPerformance.reduce(
      (top, s) => (s.highestPct != null && (top == null || s.highestPct > top.highestPct) ? s : top),
      null,
    );
    return {
      overallAverage: results.data?.percentage ?? null,
      overallGrade: results.data?.grade ?? null,
      best,
      bestSubject,
      testsTaken: completedExams.length,
      latest: completedExams[0] ?? null,
    };
  }, [completedExams, subjectPerformance, results.data]);

  const filteredCompletedExams = useMemo(() => {
    if (!searchQuery.trim()) return completedExams;
    const q = searchQuery.toLowerCase().trim();
    return completedExams.filter(
      (exam) =>
        exam.examName.toLowerCase().includes(q) || exam.subjects.some((s) => s.subject.toLowerCase().includes(q)),
    );
  }, [completedExams, searchQuery]);

  const fmtPct = (pct) => (pct == null ? '—' : `${pct}%`);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-[#FF6B2C]" />
            {tx('Tests & Examinations')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Published results and upcoming papers for {currentUser?.name}
            {className ? ` (Class ${className})` : ''}.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'COMPLETED' ? 'bg-[#FF6B2C] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Exam Scorecards ({completedExams.length})
          </button>
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'UPCOMING' ? 'bg-[#FF6B2C] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Upcoming Exams ({upcomingPapers.length})
          </button>
        </div>
      </div>

      <AdmitCardLinks student={currentUser} />

      {activeTab === 'COMPLETED' ? (
        <AsyncState state={results} loadingText="Loading your results…">
          {() => (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Average</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      {fmtPct(examStats.overallAverage)}
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      {examStats.overallGrade ? `Grade ${examStats.overallGrade}` : 'No results yet'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Highest Score</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                      {fmtPct(examStats.bestSubject?.highestPct ?? null)}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      {examStats.bestSubject ? `In ${examStats.bestSubject.subject}` : '—'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exams Published</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{examStats.testsTaken}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      {results.data?.subjects?.length ?? 0} papers in total
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <FileCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Latest Exam</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-1">
                      {fmtPct(examStats.latest?.percentage ?? null)}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                      {examStats.latest?.examName ?? '—'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {completedExams.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                  <EmptyMessage text="No results have been published for you yet." />
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex items-center gap-3">
                    <Search className="w-4 h-4 text-slate-400 ml-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by exam name or subject..."
                      className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    {filteredCompletedExams.length === 0 && <EmptyMessage text="No exams match your search." />}
                    {filteredCompletedExams.map((exam) => {
                      const isExpanded = expandedExamIds.has(exam.examId);
                      const grade = gradeFor(exam.percentage, gradeBands);
                      return (
                        <div
                          key={exam.examId}
                          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200"
                        >
                          <div
                            onClick={() => toggleExpand(exam.examId)}
                            className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-start sm:items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-[#FF6B2C] flex items-center justify-center font-bold text-sm shrink-0">
                                EX
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{exam.examName}</h3>
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-100">
                                    {exam.startDate === exam.endDate
                                      ? formatDate(exam.startDate)
                                      : `${formatDate(exam.startDate)} – ${formatDate(exam.endDate)}`}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                  {exam.subjects.length} Subjects •{' '}
                                  <strong className="text-slate-800">{fmtPct(exam.percentage)}</strong>
                                  {grade && (
                                    <>
                                      {' '}
                                      • Grade <strong className="text-[#FF6B2C]">{grade}</strong>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <div className="text-right hidden sm:block">
                                <div className="text-sm font-black text-slate-900">
                                  {exam.totalObtained} / {exam.totalMax}
                                </div>
                                <div className="text-[11px] text-slate-400">Total Marks</div>
                              </div>
                              <button
                                type="button"
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide Details' : 'View Subjects'}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
                              <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-2xs">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                      <th className="py-3 px-4 sm:px-6">Subject</th>
                                      <th className="py-3 px-4">Date</th>
                                      <th className="py-3 px-4 text-center">Marks</th>
                                      <th className="py-3 px-4 text-center">Max Marks</th>
                                      <th className="py-3 px-4 text-center">Grade</th>
                                      <th className="py-3 px-4 sm:px-6 text-right">% Score</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {exam.subjects.map((sub) => {
                                      const pct = sub.percentage;
                                      return (
                                        <tr key={sub.subject} className="hover:bg-slate-50/70 transition-colors">
                                          <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">{sub.subject}</td>
                                          <td className="py-3.5 px-4 text-slate-500">{formatDate(sub.date)}</td>
                                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                            {sub.absent ? (
                                              <span className="text-rose-600">Absent</span>
                                            ) : (
                                              (sub.obtainedMarks ?? '—')
                                            )}
                                          </td>
                                          <td className="py-3.5 px-4 text-center text-slate-500">{sub.maxMarks}</td>
                                          <td
                                            className={`py-3.5 px-4 text-center font-bold ${
                                              sub.passed ? 'text-slate-800' : 'text-rose-600'
                                            }`}
                                          >
                                            {sub.grade ?? '—'}
                                          </td>
                                          <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-900">
                                            <span
                                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                                                pct >= 90
                                                  ? 'bg-emerald-100 text-emerald-800 font-black'
                                                  : pct >= 80
                                                    ? 'bg-orange-100 text-[#EA580C] font-bold'
                                                    : !sub.passed
                                                      ? 'bg-rose-100 text-rose-700'
                                                      : 'bg-slate-100 text-slate-700'
                                              }`}
                                            >
                                              {fmtPct(pct)}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="bg-slate-100/80 border-t-2 border-slate-200 font-bold text-slate-900">
                                    <tr>
                                      <td colSpan={2} className="py-3.5 px-4 sm:px-6 uppercase text-xs text-slate-600">
                                        Total & Aggregate
                                      </td>
                                      <td className="py-3.5 px-4 text-center text-sm font-black text-[#FF6B2C]">
                                        {exam.totalObtained}
                                      </td>
                                      <td className="py-3.5 px-4 text-center text-sm">{exam.totalMax}</td>
                                      <td className="py-3.5 px-4 text-center text-sm">{grade ?? '—'}</td>
                                      <td className="py-3.5 px-4 sm:px-6 text-right">
                                        <div className="text-sm font-black text-slate-900">{fmtPct(exam.percentage)}</div>
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Subject Performance */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4">
                    <div className="pb-3 border-b border-slate-100">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">Subject Performance Overview</h3>
                      <p className="text-xs text-slate-500">Aggregated over all published results.</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-4 sm:px-6">Subject</th>
                            <th className="py-3 px-4 text-center">Papers</th>
                            <th className="py-3 px-4 text-center">Average Score</th>
                            <th className="py-3 px-4 sm:px-6 text-right">Highest Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subjectPerformance.map((item) => (
                            <tr key={item.subject} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">{item.subject}</td>
                              <td className="py-3.5 px-4 text-center font-medium text-slate-600">{item.count}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="font-bold text-slate-900">{fmtPct(item.avgPct)}</span>
                              </td>
                              <td className="py-3.5 px-4 sm:px-6 text-right font-black text-emerald-600">
                                {fmtPct(item.highestPct)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </AsyncState>
      ) : (
        <AsyncState state={schedules} loadingText="Loading exam schedule…">
          {() =>
            upcomingPapers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <EmptyMessage text="No upcoming exam papers are scheduled for your class." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-[#EA580C] border border-orange-100">
                          {paper.examName}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {paper.startTime} – {paper.endTime}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1">{paper.subject}</h3>
                      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(paper.date)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Max marks: {paper.maxMarks}</span>
                      <span>Pass: {paper.passingMarks}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </AsyncState>
      )}
    </div>
  );
};

export default StudentExamsPage;
