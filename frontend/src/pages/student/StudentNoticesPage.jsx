import React, { useMemo, useState } from 'react';
import { Megaphone, Calendar, User, Search } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDateTime } from '@/utils';
import { useI18n } from '@/i18n/translate';

const PRIORITY_STYLES = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-orange-100 text-[#FF6B2C]',
  low: 'bg-slate-100 text-slate-600',
};

export const StudentNoticesPage = () => {
  const { tx } = useI18n();
  const notices = useApi('/notices');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (notices.data || []).filter(
      (n) => !q || n.title.toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q),
    );
  }, [notices.data, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>{tx('School Notices & Circulars')}</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Official school announcements, examination schedules, and holidays
        </p>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF6B2C]"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 shrink-0">{filteredNotices.length} notices</span>
      </div>

      <AsyncState state={notices} loadingText="Loading notices…">
        {() => (
          <div className="space-y-4">
            {filteredNotices.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                <EmptyMessage text={(notices.data || []).length === 0 ? 'No notices yet.' : 'No notices match your search.'} />
              </div>
            )}
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3 hover:border-orange-200 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`px-3 py-1 font-bold rounded-xl text-xs capitalize ${
                      PRIORITY_STYLES[notice.priority] || PRIORITY_STYLES.medium
                    }`}
                  >
                    {notice.priority ? `${notice.priority} priority` : 'Announcement'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateTime(notice.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{notice.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{notice.description}</p>
                {notice.authorName && (
                  <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {notice.authorName}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </AsyncState>
    </div>
  );
};

export default StudentNoticesPage;
