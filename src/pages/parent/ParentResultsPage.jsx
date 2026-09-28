import React, { useState, useMemo } from 'react';
import {
  Award,
  FileCheck,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const ParentResultsPage = () => {
  const { currentUser, selectedChild, switchChild } = useAuth();

  const linkedChildren = currentUser?.linkedChildren || [];
  const currentChild = selectedChild || linkedChildren[0] || {
    name: 'Yash Verma',
    className: '8-A',
    rollNumber: 24,
    studentId: 'STU-2026-0824',
  };

  const [expandedExamIds, setExpandedExamIds] = useState(new Set(['EXAM-CT1', 'EXAM-MID']));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id) => {
    setExpandedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Exam records grouped by Exam/Test ID based on child class
  const examHistory = useMemo(() => {
    if (currentChild.className === '8-A') {
      return [
        {
          id: 'EXAM-CT1',
          title: 'Class Test 1 — Periodic Assessment',
          date: '25 September 2026',
          monthYear: 'September 2026',
          type: 'Class Test',
          subjects: [
            { subject: 'Mathematics', marks: 18, maxMarks: 20, teacher: 'Shahid Ali' },
            { subject: 'Hindi', marks: 16, maxMarks: 20, teacher: 'Farhat Jahan' },
            { subject: 'Science', marks: 17, maxMarks: 20, teacher: 'Javed Akhtar' },
            { subject: 'English', marks: 19, maxMarks: 20, teacher: 'Neelam Gupta' },
            { subject: 'Computer Science', marks: 20, maxMarks: 20, teacher: 'Priya Verma' },
          ],
        },
        {
          id: 'EXAM-CT2',
          title: 'Class Test 2 — Monthly Evaluation',
          date: '10 October 2026',
          monthYear: 'October 2026',
          type: 'Class Test',
          subjects: [
            { subject: 'Mathematics', marks: 17, maxMarks: 20, teacher: 'Shahid Ali' },
            { subject: 'Hindi', marks: 18, maxMarks: 20, teacher: 'Farhat Jahan' },
            { subject: 'Science', marks: 16, maxMarks: 20, teacher: 'Javed Akhtar' },
            { subject: 'English', marks: 18, maxMarks: 20, teacher: 'Neelam Gupta' },
            { subject: 'Computer Science', marks: 18, maxMarks: 20, teacher: 'Priya Verma' },
          ],
        },
        {
          id: 'EXAM-MID',
          title: 'Mid-Term Examination (Term 1)',
          date: '15 November 2026',
          monthYear: 'November 2026',
          type: 'Term Exam',
          subjects: [
            { subject: 'Mathematics', marks: 88, maxMarks: 100, teacher: 'Shahid Ali' },
            { subject: 'Hindi', marks: 84, maxMarks: 100, teacher: 'Farhat Jahan' },
            { subject: 'Science', marks: 82, maxMarks: 100, teacher: 'Javed Akhtar' },
            { subject: 'English', marks: 90, maxMarks: 100, teacher: 'Neelam Gupta' },
            { subject: 'Computer Science', marks: 94, maxMarks: 100, teacher: 'Priya Verma' },
            { subject: 'Social Studies', marks: 80, maxMarks: 100, teacher: 'Rajesh Kumar' },
          ],
        },
        {
          id: 'EXAM-FINAL',
          title: 'Unit Assessment 1 (Foundation)',
          date: '15 July 2026',
          monthYear: 'July 2026',
          type: 'Unit Test',
          subjects: [
            { subject: 'Mathematics', marks: 45, maxMarks: 50, teacher: 'Shahid Ali' },
            { subject: 'Hindi', marks: 44, maxMarks: 50, teacher: 'Farhat Jahan' },
            { subject: 'Science', marks: 41, maxMarks: 50, teacher: 'Javed Akhtar' },
            { subject: 'English', marks: 46, maxMarks: 50, teacher: 'Neelam Gupta' },
            { subject: 'Computer Science', marks: 49, maxMarks: 50, teacher: 'Priya Verma' },
          ],
        },
      ];
    }
    // Class 5-B (Ananya Verma)
    return [
      {
        id: 'EXAM-CT1',
        title: 'Class Test 1 — Periodic Assessment',
        date: '25 September 2026',
        monthYear: 'September 2026',
        type: 'Class Test',
        subjects: [
          { subject: 'Mathematics', marks: 19, maxMarks: 20, teacher: 'Anjali Singh' },
          { subject: 'Hindi', marks: 18, maxMarks: 20, teacher: 'Farhat Jahan' },
          { subject: 'Science', marks: 19, maxMarks: 20, teacher: 'Vikram Mehta' },
          { subject: 'English', marks: 18, maxMarks: 20, teacher: 'Priya Sharma' },
          { subject: 'Computer Science', marks: 20, maxMarks: 20, teacher: 'Priya Verma' },
        ],
      },
      {
        id: 'EXAM-MID',
        title: 'Mid-Term Examination (Term 1)',
        date: '18 August 2026',
        monthYear: 'August 2026',
        type: 'Term Exam',
        subjects: [
          { subject: 'Mathematics', marks: 95, maxMarks: 100, teacher: 'Anjali Singh' },
          { subject: 'Hindi', marks: 90, maxMarks: 100, teacher: 'Farhat Jahan' },
          { subject: 'Science', marks: 92, maxMarks: 100, teacher: 'Vikram Mehta' },
          { subject: 'English', marks: 94, maxMarks: 100, teacher: 'Priya Sharma' },
          { subject: 'Computer Science', marks: 98, maxMarks: 100, teacher: 'Priya Verma' },
        ],
      },
    ];
  }, [currentChild.className]);

  // Exam Calculation Helper
  const calculateExamTotals = (subjects) => {
    const totalMarks = subjects.reduce((sum, s) => sum + s.marks, 0);
    const totalMax = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const avgPercentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

    let grade = 'A+';
    if (avgPercentage < 60) grade = 'C';
    else if (avgPercentage < 75) grade = 'B';
    else if (avgPercentage < 90) grade = 'A';
    else grade = 'A+';

    return {
      totalMarks,
      totalMax,
      avgPercentage: Math.round(avgPercentage * 10) / 10,
      grade,
    };
  };

  // Top Metrics
  const summaryMetrics = useMemo(() => {
    let grandMarks = 0;
    let grandMax = 0;
    let highestPct = 0;

    examHistory.forEach((ex) => {
      const c = calculateExamTotals(ex.subjects);
      grandMarks += c.totalMarks;
      grandMax += c.totalMax;
      if (c.avgPercentage > highestPct) highestPct = c.avgPercentage;
    });

    const overallAvg = grandMax > 0 ? (grandMarks / grandMax) * 100 : 84.6;
    const latestExam = examHistory[0];
    const latestAvg = latestExam ? calculateExamTotals(latestExam.subjects).avgPercentage : 90;

    return {
      overallAvg: Math.round(overallAvg * 10) / 10,
      highestPct: Math.round(highestPct * 10) / 10,
      testsTaken: examHistory.length,
      latestAvg,
    };
  }, [examHistory]);

  // Subject Performance Aggregation
  const subjectPerformance = useMemo(() => {
    const map = {};
    examHistory.forEach((exam) => {
      exam.subjects.forEach((sub) => {
        if (!map[sub.subject]) {
          map[sub.subject] = {
            subject: sub.subject,
            testsCount: 0,
            totalMarks: 0,
            totalMax: 0,
            highestPct: 0,
          };
        }
        const pct = (sub.marks / sub.maxMarks) * 100;
        map[sub.subject].testsCount += 1;
        map[sub.subject].totalMarks += sub.marks;
        map[sub.subject].totalMax += sub.maxMarks;
        if (pct > map[sub.subject].highestPct) {
          map[sub.subject].highestPct = Math.round(pct);
        }
      });
    });

    return Object.values(map).map((item) => ({
      ...item,
      avgPct: Math.round((item.totalMarks / item.totalMax) * 100),
    }));
  }, [examHistory]);

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return examHistory;
    const q = searchQuery.toLowerCase().trim();
    return examHistory.filter(
      (ex) =>
        ex.title.toLowerCase().includes(q) ||
        ex.subjects.some((s) => s.subject.toLowerCase().includes(q))
    );
  }, [examHistory, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Child Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-[#FF6B2C]" />
            Academic Results & Marks
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Grouped test and examination report cards for {currentChild.name} (Class {currentChild.className}).
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
          <select
            value={currentChild.studentId}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Overall Average */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Average</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {summaryMetrics.overallAvg}%
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Grade A (Distinction)</p>
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
              {summaryMetrics.highestPct}%
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">In Computer Science</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Tests Taken */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tests Taken</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {summaryMetrics.testsTaken}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Evaluations completed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Latest Test */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Latest Test</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-1">
              {summaryMetrics.latestAvg}%
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Class Test 1</p>
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
          placeholder="Search results by test name or subject..."
          className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-800 focus:outline-none"
        />
      </div>

      {/* Grouped Exams List — Expandable Cards */}
      <div className="space-y-4">
        {filteredExams.map((exam) => {
          const calc = calculateExamTotals(exam.subjects);
          const isExpanded = expandedExamIds.has(exam.id);

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
                    {exam.type === 'Class Test' ? 'CT' : 'EX'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">{exam.title}</h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-100">
                        {exam.date}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {exam.subjects.length} Subjects • <strong className="text-slate-800">{calc.avgPercentage}% Average</strong> • Grade <strong className="text-[#FF6B2C]">{calc.grade}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-black text-slate-900">{calc.totalMarks} / {calc.totalMax}</div>
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
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 sm:px-6">Subject</th>
                          <th className="py-3 px-4">Instructor</th>
                          <th className="py-3 px-4 text-center">Marks</th>
                          <th className="py-3 px-4 text-center">Max Marks</th>
                          <th className="py-3 px-4 sm:px-6 text-right">% Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exam.subjects.map((sub, idx) => {
                          const pct = Math.round((sub.marks / sub.maxMarks) * 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                                {sub.subject}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">
                                {sub.teacher}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                {sub.marks}
                              </td>
                              <td className="py-3.5 px-4 text-center text-slate-500">
                                {sub.maxMarks}
                              </td>
                              <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-900">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                                    pct >= 90
                                      ? 'bg-emerald-100 text-emerald-800 font-black'
                                      : pct >= 80
                                      ? 'bg-orange-100 text-[#EA580C] font-bold'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {pct}%
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
                            {calc.totalMarks}
                          </td>
                          <td className="py-3.5 px-4 text-center text-sm">
                            {calc.totalMax}
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="text-sm font-black text-slate-900">
                              Average: {calc.avgPercentage}% • Grade {calc.grade}
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
              Aggregated subject performance for {currentChild.name} across all tests.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Subject</th>
                <th className="py-3 px-4 text-center">Tests</th>
                <th className="py-3 px-4 text-center">Average</th>
                <th className="py-3 px-4 sm:px-6 text-right">Highest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectPerformance.map((item) => (
                <tr key={item.subject} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                    {item.subject}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                    {item.testsCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-slate-900">{item.avgPct}%</span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-emerald-600">
                    {item.highestPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParentResultsPage;
