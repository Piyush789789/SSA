import React from 'react';
import { BookOpen, Award, FileText, CheckCircle2 } from 'lucide-react';

export const ProfileAcademic = ({ student }) => {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Current Grade</p>
            <p className="text-xl font-bold text-slate-900">Class {student.className}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Performance</p>
            <p className="text-xl font-bold text-slate-900">Good (78%)</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Points</p>
            <p className="text-xl font-bold text-slate-900">{student.points}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Subject Performance</h3>
          <div className="space-y-4">
            {student.marksData?.map((subjectData, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-slate-900">{subjectData.subject}</h4>
                </div>
                <div className="space-y-2">
                  {subjectData.records.map((record, rIdx) => (
                    <div key={rIdx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{record.examType}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-700">{record.marks}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          record.grade.includes('A') || record.grade.includes('B') 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {record.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examination History & Report Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Examination History</h3>
              <p className="text-xs text-slate-500">Summary of all past examinations and report cards</p>
            </div>
            <a
              href={`/admin/exams?student=${student.studentId}&tab=reportCards`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              View Report Card
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Exam</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">Unit Test 1</td>
                  <td className="py-3 px-4 text-slate-700">82%</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">A</span></td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold text-xs">Pass</span></td>
                  <td className="py-3 px-4 text-right">
                    <a href={`/admin/exams?student=${student.studentId}&tab=reportCards`} className="text-xs text-indigo-600 hover:underline font-medium">Report Card</a>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">Mid-Term Examination</td>
                  <td className="py-3 px-4 text-slate-700">86%</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">A</span></td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold text-xs">Pass</span></td>
                  <td className="py-3 px-4 text-right">
                    <a href={`/admin/exams?student=${student.studentId}&tab=reportCards`} className="text-xs text-indigo-600 hover:underline font-medium">Report Card</a>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">Final Examination (Predicted)</td>
                  <td className="py-3 px-4 text-slate-700">91%</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">A+</span></td>
                  <td className="py-3 px-4"><span className="text-emerald-600 font-bold text-xs">Pass</span></td>
                  <td className="py-3 px-4 text-right">
                    <a href={`/admin/exams?student=${student.studentId}&tab=reportCards`} className="text-xs text-indigo-600 hover:underline font-medium">Report Card</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
