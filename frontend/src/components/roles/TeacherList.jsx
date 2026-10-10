import React from 'react';
import { Search, ChevronRight, User } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'TC';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const TeacherList = ({
  teachers,
  selectedTeacherId,
  onSelectTeacher,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">Teachers</h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          {teachers.length}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search teachers..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] transition-all"
        />
      </div>

      {/* Teachers List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[600px] lg:max-h-[calc(100vh-280px)]">
        {teachers.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
            <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No teachers found.
          </div>
        ) : (
          teachers.map((teacher) => {
            const isSelected = teacher.id === selectedTeacherId;
            const initials = getInitials(teacher.name);

            return (
              <button
                type="button"
                key={teacher.id}
                onClick={() => onSelectTeacher(teacher.id)}
                className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF5F0] border-[#FF6B2C]/40 shadow-2xs'
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-amber-100/70 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-200/50">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-snug">
                      {teacher.name}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400 truncate">
                      {teacher.id}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected ? 'text-[#FF6B2C] translate-x-0.5' : 'text-slate-300'
                  }`}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
