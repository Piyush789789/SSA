import React, { useState } from 'react';
import { Megaphone, Calendar, Search, Tag, X } from 'lucide-react';

export const ParentNoticesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null);

  const noticesList = [
    {
      id: 'NOT-01',
      title: 'Half Yearly Examination Datesheet Released',
      category: 'Exams',
      date: '15/08/2026',
      content:
        'The datesheet for the Half Yearly Examination (2026-27) has been published on the notice board and in the school portal. Exams will commence from 15th September 2026. Please ensure students prepare thoroughly according to the prescribed syllabus.',
    },
    {
      id: 'NOT-02',
      title: 'Parent–Teacher Meeting (PTM)',
      category: 'Academics',
      date: '13/08/2026',
      content:
        'A Parent–Teacher Meeting for all classes will be held on Saturday, 23rd August from 9:00 AM to 1:00 PM. Parents can discuss student progress, attendance, and quarterly test evaluation with respective class teachers and subject instructors.',
    },
    {
      id: 'NOT-03',
      title: 'Quarter 2 Fee Payment Reminder',
      category: 'Accounts',
      date: '11/08/2026',
      content:
        'Parents are reminded to clear the Quarter 2 tuition fee at the earliest. A late fee will be applicable on fees submitted after the 25th of this month. Online payments can be made conveniently through the parent fee portal.',
    },
    {
      id: 'NOT-04',
      title: 'Class 10 & Class 8 Board Preparation Extra Classes',
      category: 'Academics',
      date: '09/08/2026',
      content:
        'Extra preparatory classes for Class 10 and Class 8 will be conducted every Saturday from 9:00 AM to 12:00 PM covering Science numericals and Mathematics problem-solving.',
    },
    {
      id: 'NOT-05',
      title: 'Independence Day Celebration',
      category: 'Events',
      date: '08/08/2026',
      content:
        'The school will celebrate Independence Day with flag hoisting at 8:00 AM followed by student march-past and cultural programs in the school auditorium. All parents are warmly invited.',
    },
  ];

  const filteredNotices = noticesList.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Megaphone className="w-7 h-7 text-[#FF6B2C]" />
          School Notices & Circulars
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Official announcements, exam schedules, and circulars for parents.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search circulars by keyword..."
          className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-800 focus:outline-none"
        />
      </div>

      {/* Notices Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            onClick={() => setSelectedNotice(notice)}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-[#FF6B2C]/40 hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between cursor-pointer space-y-4 group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-100">
                  {notice.category}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {notice.date}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#FF6B2C] transition-colors leading-snug mb-2">
                {notice.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed">
                {notice.content}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#FF6B2C]">
              <span>Read Full Circular</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedNotice.title}</h3>
                  <p className="text-xs text-slate-500">{selectedNotice.category} • {selectedNotice.date}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>{selectedNotice.content}</p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentNoticesPage;
