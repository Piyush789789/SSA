import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Award, CheckCircle2, BarChart3, LineChart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const StudentProgressPage = () => {
  const { currentUser } = useAuth();
  const studentName = currentUser?.name || 'Rohit Verma';

  const progressData = [
    { subject: 'Mathematics', previousAvg: 74, currentAvg: 88, improvement: 14, status: 'positive' },
    { subject: 'Science', previousAvg: 86, currentAvg: 94, improvement: 8, status: 'positive' },
    { subject: 'Hindi', previousAvg: 80, currentAvg: 89, improvement: 9, status: 'positive' },
    { subject: 'Computer Science', previousAvg: 85, currentAvg: 92, improvement: 7, status: 'positive' },
    { subject: 'English', previousAvg: 78, currentAvg: 82, improvement: 4, status: 'positive' },
    { subject: 'Environmental Studies', previousAvg: 82, currentAvg: 87, improvement: 5, status: 'positive' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>Academic Progress & Growth</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Historical improvement, test comparisons, and skill development for {studentName}
        </p>
      </div>

      {/* Progress Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Improvement</span>
          <h3 className="text-3xl font-black text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-6 h-6 stroke-[3]" />
            <span>+7.8%</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Compared to Previous Term</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Overall Score</span>
          <h3 className="text-3xl font-black text-[#FF6B2C]">88.7%</h3>
          <p className="text-xs text-slate-500 font-medium">Grade A (Outstanding)</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Regularity</span>
          <h3 className="text-3xl font-black text-blue-600">92.0%</h3>
          <p className="text-xs text-slate-500 font-medium">+2% increase this month</p>
        </div>
      </div>

      {/* Subject Improvement Comparison Cards */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Subject-wise Academic Growth</h2>
          <p className="text-xs text-slate-500">Term-over-Term comparison calculated from evaluation records</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progressData.map((item) => (
            <div
              key={item.subject}
              className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">{item.subject}</h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100/80 text-emerald-800 font-black rounded-lg text-xs">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+{item.improvement}% Growth</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block font-semibold text-[11px]">Previous Term:</span>
                  <span className="text-base font-bold text-slate-600">{item.previousAvg}%</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-orange-200">
                  <span className="text-[#FF6B2C] block font-bold text-[11px]">Current Term:</span>
                  <span className="text-base font-black text-[#FF6B2C]">{item.currentAvg}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentProgressPage;
