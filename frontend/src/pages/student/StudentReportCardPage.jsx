import React, { useRef } from 'react';
import { Award, Printer, Download, CheckCircle2, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const StudentReportCardPage = () => {
  const { currentUser } = useAuth();
  const studentName = currentUser?.name || 'Rohit Verma';
  const rollNumber = currentUser?.rollNumber || 3;
  const className = currentUser?.className || '5-B';
  const section = currentUser?.section || 'B';
  const academicYear = '2026–27';

  const reportData = [
    { subject: 'Mathematics', term1: '42 / 50', term2: '46 / 50', total: '88 / 100', pct: '88%', grade: 'A', remarks: 'Strong analytical skills. Excellent arithmetic accuracy.' },
    { subject: 'Science', term1: '46 / 50', term2: '48 / 50', total: '94 / 100', pct: '94%', grade: 'A+', remarks: 'Outstanding experiment records and conceptual clarity.' },
    { subject: 'Hindi', term1: '44 / 50', term2: '45 / 50', total: '89 / 100', pct: '89%', grade: 'A', remarks: 'Rich vocabulary and neat presentation.' },
    { subject: 'English', term1: '40 / 50', term2: '42 / 50', total: '82 / 100', pct: '82%', grade: 'A', remarks: 'Good reading comprehension and grammar.' },
    { subject: 'Computer Science', term1: '45 / 50', term2: '47 / 50', total: '92 / 100', pct: '92%', grade: 'A+', remarks: 'Passionate and attentive in practical coding labs.' },
    { subject: 'Environmental Studies', term1: '43 / 50', term2: '44 / 50', total: '87 / 100', pct: '87%', grade: 'A', remarks: 'Active participant in environmental awareness.' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Award className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>Academic Report Card</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Official progress report card for Academic Session {academicYear}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4 stroke-[2]" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Official Report Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-8 print:border-none print:shadow-none">
        {/* School Header */}
        <div className="text-center border-b border-slate-100 pb-6 space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-[#FF6B2C]/20">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Shiv Shanti Adarsh Academy
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Affiliated to Central Board of Secondary Education • Academic Evaluation Card
          </p>
          <span className="inline-block px-3 py-1 bg-orange-100 text-[#FF6B2C] font-bold rounded-full text-xs mt-1">
            Session: {academicYear}
          </span>
        </div>

        {/* Student Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block">Student Name:</span>
            <span className="font-extrabold text-slate-900 text-sm">{studentName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Roll Number:</span>
            <span className="font-extrabold text-slate-900 text-sm">#{rollNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Class & Section:</span>
            <span className="font-extrabold text-slate-900 text-sm">Class {className}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Class Teacher:</span>
            <span className="font-extrabold text-slate-900 text-sm">Anjali Singh</span>
          </div>
        </div>

        {/* Grades Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5">Subject</th>
                <th className="py-3.5 px-4">Mid-Term</th>
                <th className="py-3.5 px-4">Periodic Test</th>
                <th className="py-3.5 px-4">Total Marks</th>
                <th className="py-3.5 px-4">Percentage</th>
                <th className="py-3.5 px-4">Grade</th>
                <th className="py-3.5 px-5">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-4 px-5 font-bold text-slate-900">{row.subject}</td>
                  <td className="py-4 px-4 font-semibold text-slate-600">{row.term1}</td>
                  <td className="py-4 px-4 font-semibold text-slate-600">{row.term2}</td>
                  <td className="py-4 px-4 font-extrabold text-slate-900">{row.total}</td>
                  <td className="py-4 px-4 font-bold text-[#FF6B2C]">{row.pct}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-black text-xs">
                      {row.grade}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-600 text-[11px] italic">{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Overall Evaluation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-center">
            <span className="text-xs font-bold text-emerald-800">Overall Percentage</span>
            <h4 className="text-2xl font-black text-emerald-900 mt-1">88.67%</h4>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Rank: 3rd in Class</p>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-center">
            <span className="text-xs font-bold text-blue-800">Final Grade</span>
            <h4 className="text-2xl font-black text-blue-900 mt-1">Grade A (Excellent)</h4>
            <p className="text-[11px] text-blue-700 font-semibold mt-0.5">Eligible for Promotion</p>
          </div>

          <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl text-center">
            <span className="text-xs font-bold text-orange-800">Annual Attendance</span>
            <h4 className="text-2xl font-black text-orange-900 mt-1">92.0%</h4>
            <p className="text-[11px] text-orange-700 font-semibold mt-0.5">Regularity Maintained</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs text-slate-500">
          <div className="border-t border-slate-300 pt-2 font-bold">Class Teacher Signature</div>
          <div className="border-t border-slate-300 pt-2 font-bold">Parent Signature</div>
          <div className="border-t border-slate-300 pt-2 font-bold">Principal Signature</div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportCardPage;
