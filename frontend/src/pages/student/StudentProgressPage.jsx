import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { bandFor, groupByExam } from './resultsUtils';

const round1 = (n) => Math.round(n * 10) / 10;

const Change = ({ value, suffix = '' }) => {
  if (value == null) return <span className="text-slate-400">—</span>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const color = value > 0 ? 'text-emerald-600' : value < 0 ? 'text-rose-600' : 'text-slate-500';
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="w-5 h-5 stroke-[3]" />
      <span>
        {value > 0 ? '+' : ''}
        {value}
        {suffix}
      </span>
    </span>
  );
};

export const StudentProgressPage = () => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.studentId || currentUser?.id;

  const results = useApi(studentId ? `/results/students/${studentId}` : null);
  const attendance = useApi(studentId ? `/attendance/students/${studentId}/stats` : null);
  const meta = useApi('/meta');
  const gradeBands = meta.data?.gradeBands;

  // Exams newest first.
  const exams = useMemo(() => groupByExam(results.data?.subjects), [results.data]);
  const latest = exams[0] ?? null;
  const previous = exams[1] ?? null;

  const overallChange =
    latest?.percentage != null && previous?.percentage != null ? round1(latest.percentage - previous.percentage) : null;

  // Per subject: latest result vs the subject's previous result (from any earlier exam).
  const subjectTrends = useMemo(() => {
    const bySubject = new Map();
    [...(results.data?.subjects || [])]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach((r) => {
        if (!bySubject.has(r.subject)) bySubject.set(r.subject, []);
        bySubject.get(r.subject).push(r);
      });
    return [...bySubject.entries()]
      .map(([subject, list]) => {
        const current = list[list.length - 1];
        const prior = list.length > 1 ? list[list.length - 2] : null;
        const change =
          prior && current.percentage != null && prior.percentage != null
            ? round1(current.percentage - prior.percentage)
            : null;
        return { subject, current, prior, change, count: list.length };
      })
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [results.data]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>Academic Progress & Growth</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Trends calculated from {currentUser?.name ? `${currentUser.name}'s` : 'your'} published exam results
        </p>
      </div>

      <AsyncState state={results} loadingText="Loading your results…">
        {() => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Since Last Exam</span>
                <h3 className="text-3xl font-black flex items-center gap-1">
                  <Change value={overallChange} suffix="%" />
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {overallChange != null
                    ? `${latest.examName} vs ${previous.examName}`
                    : 'Needs at least two published exams'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latest Exam Score</span>
                <h3 className="text-3xl font-black text-[#FF6B2C]">
                  {latest?.percentage != null ? `${latest.percentage}%` : '—'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {latest
                    ? `${latest.examName}${
                        bandFor(latest.percentage, gradeBands)
                          ? ` • Grade ${bandFor(latest.percentage, gradeBands).grade} (${bandFor(latest.percentage, gradeBands).label})`
                          : ''
                      }`
                    : 'No published results yet'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Regularity</span>
                <h3 className="text-3xl font-black text-blue-600">
                  {attendance.data?.rate != null ? `${attendance.data.rate}%` : '—'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {attendance.error
                    ? attendance.error.message
                    : attendance.data
                      ? `${attendance.data.workingDays ?? 0} working days recorded this year`
                      : 'Loading…'}
                </p>
              </div>
            </div>

            {/* Exam-by-exam history */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Exam History</h2>
                <p className="text-xs text-slate-500">Overall percentage in each published exam, oldest first</p>
              </div>
              {exams.length === 0 ? (
                <EmptyMessage text="No published results yet." />
              ) : (
                <div className="space-y-3">
                  {[...exams].reverse().map((exam) => (
                    <div key={exam.examId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">{exam.examName}</span>
                        <span className="text-slate-900 font-bold">
                          {exam.percentage != null ? `${exam.percentage}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#FF6B2C]"
                          style={{ width: `${Math.min(100, exam.percentage ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {exams.length < 2 && (
                    <p className="text-xs text-slate-500 pt-2">
                      Only one exam has been published so far — trends will appear after the next one.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Subject trends */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Subject-wise Academic Growth</h2>
                <p className="text-xs text-slate-500">Latest paper compared with the previous paper in the same subject</p>
              </div>

              {subjectTrends.length === 0 ? (
                <EmptyMessage text="No published results yet." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjectTrends.map((item) => (
                    <div key={item.subject} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-slate-900">{item.subject}</h4>
                        {item.change != null ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 font-black rounded-lg text-xs ${
                              item.change > 0
                                ? 'bg-emerald-100/80 text-emerald-800'
                                : item.change < 0
                                  ? 'bg-rose-100/80 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.change > 0 ? '+' : ''}
                            {item.change}%
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-bold rounded-lg text-[11px]">
                            Not enough data
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 block font-semibold text-[11px] truncate">
                            {item.prior ? item.prior.examName : 'Previous'}:
                          </span>
                          <span className="text-base font-bold text-slate-600">
                            {item.prior?.percentage != null ? `${item.prior.percentage}%` : '—'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-orange-200">
                          <span className="text-[#FF6B2C] block font-bold text-[11px] truncate">
                            {item.current.examName}:
                          </span>
                          <span className="text-base font-black text-[#FF6B2C]">
                            {item.current.absent
                              ? 'Absent'
                              : item.current.percentage != null
                                ? `${item.current.percentage}%`
                                : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </AsyncState>
    </div>
  );
};

export default StudentProgressPage;
