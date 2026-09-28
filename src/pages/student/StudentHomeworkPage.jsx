import React, { useState, useMemo } from 'react';
import { BookOpenCheck, Calendar, CheckCircle2, Clock, FileText, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const StudentHomeworkPage = () => {
  const { currentUser } = useAuth();
  const { homeworkList } = useData();

  const className = currentUser?.className || '5-B';
  const studentName = currentUser?.name || 'Rohit Verma';

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedIds, setCompletedIds] = useState(new Set(['HW-2026-003']));

  const filteredList = useMemo(() => {
    return homeworkList
      .filter((hw) => hw.className === className)
      .filter((hw) => {
        if (filterStatus === 'Pending' && completedIds.has(hw.id)) return false;
        if (filterStatus === 'Completed' && !completedIds.has(hw.id)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = hw.title.toLowerCase().includes(q);
          const matchSubj = hw.subject.toLowerCase().includes(q);
          if (!matchTitle && !matchSubj) return false;
        }
        return true;
      });
  }, [homeworkList, className, filterStatus, searchQuery, completedIds]);

  const toggleSubmit = (hwId) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(hwId)) next.delete(hwId);
      else next.add(hwId);
      return next;
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <BookOpenCheck className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>My Homework & Assignments</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Track homework, due dates, and submit assignments for Class {className}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search homework..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Assignments</option>
            <option value="Pending">Pending / Active</option>
            <option value="Completed">Submitted</option>
          </select>
        </div>

        <span className="text-xs font-bold text-slate-400">
          {filteredList.length} assignments found
        </span>
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredList.map((hw) => {
          const isDone = completedIds.has(hw.id);

          return (
            <div
              key={hw.id}
              className={`p-6 rounded-3xl border shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                isDone
                  ? 'bg-slate-50/70 border-slate-200 opacity-80'
                  : 'bg-white border-slate-200/80 hover:border-orange-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-orange-100 text-[#FF6B2C] font-bold rounded-lg text-xs">
                    {hw.subject}
                  </span>
                  {isDone ? (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submitted
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {hw.dueDate}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{hw.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{hw.description}</p>
                {hw.instructions && (
                  <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    <strong>Instructions:</strong> {hw.instructions}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Teacher: {hw.teacherName || 'Anjali Singh'}
                </span>

                <button
                  onClick={() => toggleSubmit(hw.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDone
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-[#FF6B2C] hover:bg-[#F25A1B] text-white shadow-sm'
                  }`}
                >
                  {isDone ? 'Mark as Pending' : 'Mark as Completed'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentHomeworkPage;
