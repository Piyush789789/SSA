import React from 'react';
import { X, Printer, Download, GraduationCap, Award, CheckCircle2 } from 'lucide-react';

export const ReportCardPreviewModal = ({ isOpen, onClose, student, examName = 'Mid-Term Examination' }) => {
  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = () => {
    // Create a Blob or download simulation for ReportCard_<StudentID>_<Exam>.pdf
    const fileName = `ReportCard_${student.id || 'STU-2026-0015'}_${examName.replace(/\s+/g, '_')}.pdf`;
    const textContent = `
============================================================
SSA SHIV SHANTI ADARSH ACADEMY
ACADEMIC SESSION: 2026-27
OFFICIAL REPORT CARD — ${examName.toUpperCase()}
============================================================

STUDENT INFORMATION:
Student Name: ${student.name}
Student ID:   ${student.id || 'STU-2026-0015'}
Roll Number:  ${student.rollNumber || 1}
Class:        ${student.className || '10-A'}

SUBJECT-WISE PERFORMANCE:
------------------------------------------------------------
Subject             Max Marks   Obtained   Percentage   Grade
------------------------------------------------------------
Mathematics         100         82         82%          A
English             100         91         91%          A+
Science             100         95         95%          A+
Hindi               100         85         85%          A
Computer Science    100         88         88%          A
------------------------------------------------------------

OVERALL ACADEMIC SUMMARY:
Total Marks:    441 / 500
Overall Rate:   88.2%
Overall Grade:  A+
GPA Score:      9.0 / 10.0
Result Status:  PASS

ATTENDANCE SUMMARY:
Total Working Days: 24
Days Present:       21
Days Absent:        3
Attendance Rate:    87.5%

TEACHER REMARK:
"Excellent academic performance and consistent participation."

SIGNATURES:
Class Teacher: ___________________
Principal:     ___________________
School Seal:   [ SSA ADARSH ACADEMY OFFICIAL SEAL ]
============================================================
    `;

    const blob = new Blob([textContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Action Header Bar (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Official Student Report Card</h3>
              <p className="text-xs text-slate-400">Printable A4 report card preview</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Report</span>
            </button>

            <button
              type="button"
              onClick={handleGeneratePDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B2C] hover:bg-[#e85a1c] text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-[#FF6B2C]/20"
            >
              <Download className="w-4 h-4" />
              <span>Generate PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 REPORT CARD BODY */}
        <div className="border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 print:border-none print:p-0">
          
          {/* School Header */}
          <div className="text-center border-b-2 border-[#FF6B2C] pb-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                SSA SHIV SHANTI ADARSH ACADEMY
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Affiliated to State Board • Session 2026-27
            </p>
            <div className="mt-3 inline-block px-5 py-1 bg-amber-50 border border-amber-200 text-[#FF6B2C] font-black text-xs uppercase tracking-widest rounded-full">
              REPORT CARD — {examName.toUpperCase()}
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Student Name</p>
              <p className="font-extrabold text-slate-900 mt-0.5">{student.name}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Student ID</p>
              <p className="font-bold text-slate-700 mt-0.5">{student.id || 'STU-2026-0015'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Class &amp; Section</p>
              <p className="font-bold text-slate-700 mt-0.5">Class {student.className || '10-A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Roll Number</p>
              <p className="font-bold text-slate-700 mt-0.5">{student.rollNumber || 1}</p>
            </div>
          </div>

          {/* Subject Marks Table */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Subject-Wise Performance
            </h4>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3 text-center">Max Marks</th>
                  <th className="py-2 px-3 text-center">Obtained Marks</th>
                  <th className="py-2 px-3 text-center">Percentage</th>
                  <th className="py-2 px-3 text-center">Grade</th>
                  <th className="py-2 px-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {[
                  { subject: 'Mathematics', max: 100, obtained: 82, percent: '82%', grade: 'A', result: 'Pass' },
                  { subject: 'English', max: 100, obtained: 91, percent: '91%', grade: 'A+', result: 'Pass' },
                  { subject: 'Science', max: 100, obtained: 95, percent: '95%', grade: 'A+', result: 'Pass' },
                  { subject: 'Hindi', max: 100, obtained: 85, percent: '85%', grade: 'A', result: 'Pass' },
                  { subject: 'Computer Science', max: 100, obtained: 88, percent: '88%', grade: 'A', result: 'Pass' },
                ].map((row) => (
                  <tr key={row.subject}>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.subject}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{row.max}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{row.obtained}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{row.percent}</td>
                    <td className="py-2.5 px-3 text-center font-black text-emerald-700">{row.grade}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {row.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Overall Result & Attendance Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Overall Result */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider">Overall Academic Result</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div>
                  <p className="text-slate-500 text-[10px]">Total Marks</p>
                  <p className="text-slate-900 text-sm font-black">441 / 500</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Percentage</p>
                  <p className="text-[#FF6B2C] text-sm font-black">88.2%</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Grade / GPA</p>
                  <p className="text-slate-900">A+ (GPA: 9.0)</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Final Status</p>
                  <p className="text-emerald-700 font-black">PASS</p>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 space-y-2">
              <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">Attendance Performance</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div>
                  <p className="text-slate-500 text-[10px]">Working Days</p>
                  <p className="text-slate-900">24 Days</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Present / Absent</p>
                  <p className="text-slate-900">21 / 3</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-[10px]">Attendance Rate</p>
                  <p className="text-indigo-700 font-black text-sm">87.5%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Remarks */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Class Teacher's Remark</p>
            <p className="font-semibold text-slate-800 italic mt-0.5">
              "Excellent academic performance and consistent participation in class activities. Keep up the great effort!"
            </p>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-3 gap-4 pt-10 text-center text-xs font-bold text-slate-700">
            <div>
              <div className="border-b border-slate-300 pb-1 mb-1">Class Teacher</div>
              <span className="text-[10px] font-normal text-slate-400">Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-300 pb-1 mb-1">Principal</div>
              <span className="text-[10px] font-normal text-slate-400">Signature &amp; Stamp</span>
            </div>
            <div>
              <div className="border-2 border-dashed border-amber-300 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-[9px] font-black text-amber-700 uppercase leading-tight p-1">
                Official Seal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
