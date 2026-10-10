import React, { useState, useMemo } from 'react';
import { Award, FileCheck, TrendingUp, Search, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { AdmitCardLinks } from '@/components/exams/AdmitCardLinks';
import { useI18n } from '@/i18n/translate';
import { formatDate } from '@/utils';

const round1 = (value) => Math.round(value * 10) / 10;

/** Same rule as the backend: round the percentage, then find the band that contains it. */
const bandFor = (gradeBands, percentage) => {
  if (percentage == null || !gradeBands?.length) return null;
  const rounded = Math.round(Math.max(0, Math.min(100, percentage)));
  return gradeBands.find((band) => rounded >= band.min && rounded <= band.max) || null;
};

/** Groups the API's subject results into exams, newest exam first. */
const groupByExam = (subjects, gradeBands) => {
  const map = new Map();
  subjects.forEach((s) => {
    if (!map.has(s.examId)) {
      map.set(s.examId, { id: s.examId, title: s.examName, subjects: [], firstDate: s.date, lastDate: s.date });
    }
    const exam = map.get(s.examId);
    exam.subjects.push(s);
    if (s.date < exam.firstDate) exam.firstDate = s.date;
    if (s.date > exam.lastDate) exam.lastDate = s.date;
  });
  return [...map.values()]
    .map((exam) => {
      const totalMax = exam.subjects.reduce((sum, s) => sum + (s.maxMarks || 0), 0);
      const totalMarks = exam.subjects.reduce((sum, s) => sum + (s.obtainedMarks ?? 0), 0);
      const avgPercentage = totalMax > 0 ? round1((totalMarks * 100) / totalMax) : null;
      const band = bandFor(gradeBands, avgPercentage);
      return { ...exam, totalMax, totalMarks, avgPercentage, grade: band?.grade ?? '—', gradeLabel: band?.label };
    })
    .sort((a, b) => (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0));
};

export const ParentResultsPage = () => {
  const { tx } = useI18n();
  const { currentUser, selectedChild, switchChild } = useAuth();
  const linkedChildren = currentUser?.linkedChildren || [];
  const childId = selectedChild?.studentId ?? null;

  const results = useApi(childId ? `/results/students/${encodeURIComponent(childId)}` : null);
  const meta = useApi('/meta');

  const [collapsedExamIds, setCollapsedExamIds] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id) => {
    setCollapsedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const gradeBands = meta.data?.gradeBands;
  const examHistory = useMemo(
    () => groupByExam(results.data?.subjects || [], gradeBands),
    [results.data, gradeBands],
  );

  const summaryMetrics = useMemo(() => {
    const subjects = results.data?.subjects || [];
    const best = subjects
      .filter((s) => !s.absent && s.percentage != null)
      .reduce((top, s) => (!top || s.percentage > top.percentage ? s : top), null);
    const overallBand = bandFor(gradeBands, results.data?.percentage);
    return {
      overallAvg: results.data?.percentage,
      overallGrade: results.data?.grade,
      overallLabel: overallBand?.label,
      best,
      testsTaken: examHistory.length,
      papers: subjects.length,
      latest: examHistory[0] || null,
    };
  }, [results.data, examHistory, gradeBands]);

  const subjectPerformance = useMemo(() => {
    const map = {};
    (results.data?.subjects || []).forEach((sub) => {
      if (!map[sub.subject]) {
        map[sub.subject] = { subject: sub.subject, testsCount: 0, totalMarks: 0, totalMax: 0, highestPct: null };
      }
      const item = map[sub.subject];
      item.testsCount += 1;
      item.totalMarks += sub.obtainedMarks ?? 0;
      item.totalMax += sub.maxMarks || 0;
      if (!sub.absent && sub.percentage != null && (item.highestPct == null || sub.percentage > item.highestPct)) {
        item.highestPct = sub.percentage;
      }
    });
    return Object.values(map)
      .map((item) => ({ ...item, avgPct: item.totalMax > 0 ? round1((item.totalMarks * 100) / item.totalMax) : null }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [results.data]);

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return examHistory;
    const q = searchQuery.toLowerCase().trim();
    return examHistory.filter(
      (ex) => ex.title.toLowerCase().includes(q) || ex.subjects.some((s) => s.subject.toLowerCase().includes(q)),
    );
  }, [examHistory, searchQuery]);

  if (!selectedChild) {
    return <EmptyMessage text="No child is linked to this parent account yet." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Child Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-[#FF6B2C]" />
            {tx('Academic Results & Marks')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Published examination report cards for {selectedChild.name} (Class {selectedChild.className}).
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
          <select
            value={selectedChild.studentId}
            onChange={(e) => switchChild(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer pr-3"
          >
            {linkedChildren.map((child) => (
              <option key={child.studentId} value={child.studentId}>
                {child.name} ({child.className})
              </option>
            ))}
          </select>
        </div>
      </div>

      <AdmitCardLinks student={selectedChild} />

      <AsyncState state={[results, meta]} loadingText="Loading results…">
        {() =>
          examHistory.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
              <EmptyMessage text={`No published results for ${selectedChild.name} yet.`} />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Overall Average */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Average</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      {summaryMetrics.overallAvg == null ? '—' : `${summaryMetrics.overallAvg}%`}
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      Grade {summaryMetrics.overallGrade ?? '—'}
                      {summaryMetrics.overallLabel ? ` (${summaryMetrics.overallLabel})` : ''}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                {/* Highest Score */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Highest Score</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                      {summaryMetrics.best ? `${summaryMetrics.best.percentage}%` : '—'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      {summaryMetrics.best
                        ? `In ${summaryMetrics.best.subject} (${summaryMetrics.best.examName})`
                        : 'No scored papers'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                {/* Exams Taken */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exams Taken</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      {summaryMetrics.testsTaken}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">{summaryMetrics.papers} papers published</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <FileCheck className="w-6 h-6" />
                  </div>
                </div>

                {/* Latest Exam */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Latest Exam</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-1">
                      {summaryMetrics.latest?.avgPercentage == null ? '—' : `${summaryMetrics.latest.avgPercentage}%`}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 truncate max-w-[140px]">
                      {summaryMetrics.latest?.title}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search results by exam name or subject..."
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-800 focus:outline-none"
                />
              </div>

              {/* Grouped Exams List — Expandable Cards */}
              <div className="space-y-4">
                {filteredExams.length === 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                    <EmptyMessage text="No results match your search." />
                  </div>
                )}
                {filteredExams.map((exam) => {
                  const isExpanded = !collapsedExamIds.has(exam.id);
                  const dateLabel =
                    exam.firstDate === exam.lastDate
                      ? formatDate(exam.firstDate)
                      : `${formatDate(exam.firstDate)} – ${formatDate(exam.lastDate)}`;

                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200"
                    >
                      {/* Compact Header */}
                      <div
                        onClick={() => toggleExpand(exam.id)}
                        className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-[#FF6B2C] flex items-center justify-center font-bold text-sm shrink-0">
                            {exam.grade}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base sm:text-lg font-bold text-slate-900">{exam.title}</h3>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-100">
                                {dateLabel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                              {exam.subjects.length} Subjects •{' '}
                              <strong className="text-slate-800">
                                {exam.avgPercentage == null ? '—' : `${exam.avgPercentage}%`} Overall
                              </strong>{' '}
                              • Grade <strong className="text-[#FF6B2C]">{exam.grade}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-black text-slate-900">
                              {exam.totalMarks} / {exam.totalMax}
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

                      {/* Expanded Multi-Subject Table */}
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
                                    <tr key={`${exam.id}-${sub.subject}`} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">{sub.subject}</td>
                                      <td className="py-3.5 px-4 text-slate-500">{formatDate(sub.date)}</td>
                                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                        {sub.absent ? 'Absent' : sub.obtainedMarks}
                                      </td>
                                      <td className="py-3.5 px-4 text-center text-slate-500">{sub.maxMarks}</td>
                                      <td className="py-3.5 px-4 text-center">
                                        <span
                                          className={`text-xs font-bold ${sub.passed ? 'text-emerald-700' : 'text-rose-600'}`}
                                        >
                                          {sub.grade}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-900">
                                        <span
                                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                                            pct == null
                                              ? 'bg-slate-100 text-slate-500'
                                              : pct >= 90
                                              ? 'bg-emerald-100 text-emerald-800 font-black'
                                              : pct >= 80
                                              ? 'bg-orange-100 text-[#EA580C] font-bold'
                                              : !sub.passed
                                              ? 'bg-rose-100 text-rose-700'
                                              : 'bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          {pct == null ? '—' : `${pct}%`}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              {/* Total Aggregate Row */}
                              <tfoot className="bg-slate-100/80 border-t-2 border-slate-200 font-bold text-slate-900">
                                <tr>
                                  <td colSpan={2} className="py-3.5 px-4 sm:px-6 uppercase text-xs text-slate-600">
                                    Total:
                                  </td>
                                  <td className="py-3.5 px-4 text-center text-sm font-black text-[#FF6B2C]">
                                    {exam.totalMarks}
                                  </td>
                                  <td className="py-3.5 px-4 text-center text-sm">{exam.totalMax}</td>
                                  <td colSpan={2} className="py-3.5 px-4 sm:px-6 text-right">
                                    <div className="text-sm font-black text-slate-900">
                                      Overall: {exam.avgPercentage == null ? '—' : `${exam.avgPercentage}%`} • Grade{' '}
                                      {exam.grade}
                                    </div>
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

              {/* Subject Performance Section */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Subject Performance</h3>
                    <p className="text-xs text-slate-500">
                      Aggregated subject performance for {selectedChild.name} across all published exams.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 sm:px-6">Subject</th>
                        <th className="py-3 px-4 text-center">Papers</th>
                        <th className="py-3 px-4 text-center">Average</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Highest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjectPerformance.map((item) => (
                        <tr key={item.subject} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">{item.subject}</td>
                          <td className="py-3.5 px-4 text-center font-medium text-slate-600">{item.testsCount}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-900">
                              {item.avgPct == null ? '—' : `${item.avgPct}%`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 text-right font-black text-emerald-600">
                            {item.highestPct == null ? '—' : `${item.highestPct}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        }
      </AsyncState>
    </div>
  );
};

export default ParentResultsPage;
