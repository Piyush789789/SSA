import React, { useMemo, useState } from 'react';
import { Megaphone, Calendar, User, Search } from 'lucide-react';
import { useData } from '@/context/DataContext';

export const StudentNoticesPage = () => {
  const { notices } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const t = n.title.toLowerCase().includes(q);
        const d = n.description.toLowerCase().includes(q);
        if (!t && !d) return false;
      }
      return true;
    });
  }, [notices, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>School Notices & Circulars</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Official school announcements, examination schedules, and holidays
        </p>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF6B2C]"
          />
        </div>
        <span className="text-xs font-bold text-slate-400">{filteredNotices.length} notices</span>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3 hover:border-orange-200 transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="px-3 py-1 bg-orange-100 text-[#FF6B2C] font-bold rounded-xl text-xs">
                Official Announcement
              </span>
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {notice.createdAt}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900">{notice.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{notice.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentNoticesPage;
