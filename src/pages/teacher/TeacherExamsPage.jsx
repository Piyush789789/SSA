import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Calendar, Clock, Edit3, Eye, Search, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const TeacherExamsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { exams, schedules } = useData();

  const assignedClasses = currentUser?.assignedClasses || ['5-B', '6-A'];
  const teacherSubjects = currentUser?.subjects || ['Mathematics', 'Science'];

  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Filter exam schedules for assigned classes & subjects
  const relevantSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const isClassMatch = assignedClasses.includes(sch.className);
      const isSubjectMatch = teacherSubjects.includes(sch.subject);

      if (!isClassMatch || !isSubjectMatch) return false;

      if (selectedClassFilter !== 'ALL' && sch.className !== selectedClassFilter) return false;

      if (activeTab === 'Upcoming' && sch.status !== 'Upcoming' && sch.status !== 'Scheduled') return false;
      if (activeTab === 'Active' && sch.status !== 'Active' && sch.status !== 'Ongoing') return false;
      if (activeTab === 'Completed' && sch.status !== 'Completed') return false;

      return true;
    });
  }, [schedules, assignedClasses, teacherSubjects, selectedClassFilter, activeTab]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <FileCheck className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>Tests & Examinations</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Manage test schedules and evaluate student marks for your assigned classes
          </p>
        </div>
      </div>

      {/* Tabs & Class Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          {['ALL', 'Active', 'Upcoming', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-[#FF6B2C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Exams' : tab}
            </button>
          ))}
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter Class:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Assigned</option>
            {assignedClasses.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relevantSchedules.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
            No examination schedules found for your assigned classes and subjects under this tab.
          </div>
        ) : (
          relevantSchedules.map((sch) => {
            const parentExam = exams.find((e) => e.id === sch.examId);
            const examTitle = parentExam ? parentExam.name : 'Periodic Assessment';

            return (
              <div
                key={sch.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-orange-200 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Status Badge & Class Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-orange-100 text-[#FF6B2C] font-bold rounded-lg text-xs">
                      Class {sch.className}
                    </span>

                    {sch.status === 'Completed' && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-[11px]">
                        Completed
                      </span>
                    )}
                    {sch.status === 'Active' && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-xl text-[11px] animate-pulse">
                        Active / Evaluation Open
                      </span>
                    )}
                    {(sch.status === 'Upcoming' || sch.status === 'Scheduled') && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl text-[11px]">
                        Upcoming
                      </span>
                    )}
                  </div>

                  {/* Exam & Subject Titles */}
                  <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{sch.subject}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{examTitle}</p>

                  {/* Date, Time & Max Marks */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 stroke-[2]" />
                        <span>Date:</span>
                      </span>
                      <span className="font-bold text-slate-800">{sch.date}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 stroke-[2]" />
                        <span>Time:</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {sch.startTime} - {sch.endTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Max Marks:</span>
                      <span className="font-extrabold text-[#FF6B2C]">{sch.maxMarks} Marks</span>
                    </div>
                  </div>
                </div>

                {/* Actions Button */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/teacher/exams/${sch.id}/marks`)}
                    className="w-full h-10 bg-[#FFF5F0] hover:bg-[#FF6B2C] text-[#FF6B2C] hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <Edit3 className="w-4 h-4 stroke-[2]" />
                    <span>Enter / Edit Marks</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeacherExamsPage;
