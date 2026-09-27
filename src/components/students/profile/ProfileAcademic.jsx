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

        {/* Recent Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Results</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View All <FileText className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {student.resultsData?.slice(0, 5).map((result) => (
              <div key={result.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-medium text-slate-900 text-sm">{result.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{result.subject} • {result.date}</p>
                </div>
                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{result.marks} / {result.total}</p>
                    <p className="text-xs text-slate-500">{result.percent}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    result.result === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {result.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
