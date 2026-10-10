import React, { useState, useMemo } from 'react';
import { BookOpenCheck, Clock, Paperclip, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { withQuery } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDate, todayIso } from '@/utils';

export const StudentHomeworkPage = () => {
  const { currentUser } = useAuth();
  const className = currentUser?.className;

  const homework = useApi(className ? withQuery('/homework', { className }) : null);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const today = todayIso();
  const subjects = useMemo(
    () => [...new Set((homework.data || []).map((hw) => hw.subject))].sort(),
    [homework.data],
  );

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (homework.data || [])
      .filter((hw) => {
        if (filterStatus === 'UPCOMING' && hw.dueDate < today) return false;
        if (filterStatus === 'PAST' && hw.dueDate >= today) return false;
        if (subjectFilter !== 'ALL' && hw.subject !== subjectFilter) return false;
        if (q && !hw.title.toLowerCase().includes(q) && !hw.subject.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        // Upcoming first (soonest due), then past (most recent first).
        const aPast = a.dueDate < today;
        const bPast = b.dueDate < today;
        if (aPast !== bPast) return aPast ? 1 : -1;
        return aPast ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate);
      });
  }, [homework.data, filterStatus, subjectFilter, searchQuery, today]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <BookOpenCheck className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>My Homework & Assignments</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Homework and due dates{className ? ` for Class ${className}` : ''}
        </p>
      </div>

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
            <option value="UPCOMING">Due today or later</option>
            <option value="PAST">Past due date</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-bold text-slate-400">{filteredList.length} assignments found</span>
      </div>

      <AsyncState state={homework} loadingText="Loading homework…">
        {() =>
          filteredList.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <EmptyMessage
                text={(homework.data || []).length === 0 ? 'No homework has been assigned yet.' : 'No homework matches your filters.'}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredList.map((hw) => {
                const isPast = hw.dueDate < today;
                const isToday = hw.dueDate === today;
                return (
                  <div
                    key={hw.id}
                    className={`p-6 rounded-3xl border shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                      isPast ? 'bg-slate-50/70 border-slate-200 opacity-80' : 'bg-white border-slate-200/80 hover:border-orange-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-orange-100 text-[#FF6B2C] font-bold rounded-lg text-xs">
                          {hw.subject}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 border rounded-lg text-xs font-bold flex items-center gap-1 ${
                            isPast
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : isToday
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isToday ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {isToday ? 'Due today' : `${isPast ? 'Was due' : 'Due'}: ${formatDate(hw.dueDate)}`}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{hw.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{hw.description}</p>
                      {hw.instructions && (
                        <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          <strong>Instructions:</strong> {hw.instructions}
                        </p>
                      )}
                      {hw.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {hw.attachments.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold"
                            >
                              <Paperclip className="w-3 h-3" />
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>Teacher: {hw.teacherName || '—'}</span>
                      <span>Assigned {formatDate(hw.assignedDate)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </AsyncState>
    </div>
  );
};

export default StudentHomeworkPage;
