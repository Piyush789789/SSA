import React, { useState, useMemo } from 'react';
import { Megaphone, Calendar, User, AlertCircle, Search, Filter, Plus, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export const TeacherNoticesPage = () => {
  const { currentUser } = useAuth();
  const { notices, addNotice } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const [newNotice, setNewNotice] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  const teacherName = currentUser?.name || 'Anjali Singh';

  // Sort newest first & filter
  const filteredNotices = useMemo(() => {
    return notices
      .filter((notice) => {
        if (priorityFilter !== 'ALL' && notice.priority !== priorityFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = notice.title.toLowerCase().includes(q);
          const matchDesc = notice.description.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notices, priorityFilter, searchQuery]);

  const handlePostNotice = (e) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.description) return;

    const noticeItem = {
      id: `notice-${Date.now()}`,
      title: newNotice.title,
      description: newNotice.description,
      priority: newNotice.priority,
      author: teacherName,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addNotice(noticeItem);
    setIsPostModalOpen(false);
    setNewNotice({ title: '', description: '', priority: 'medium' });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>Notice Board</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            School-wide announcements, circulars, and class notices
          </p>
        </div>

        <button
          onClick={() => setIsPostModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Post Class Notice</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF6B2C]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Notices List Cards */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => {
          let priorityClass = 'bg-blue-50 text-blue-700 border-blue-200';
          if (notice.priority === 'high') priorityClass = 'bg-rose-50 text-rose-700 border-rose-200';
          if (notice.priority === 'medium') priorityClass = 'bg-amber-50 text-amber-700 border-amber-200';

          return (
            <div
              key={notice.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-orange-200 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border capitalize ${priorityClass}`}>
                  {notice.priority} Priority
                </span>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 stroke-[2]" />
                    <span>{notice.author}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 stroke-[2]" />
                    <span>{notice.createdAt}</span>
                  </span>
                </div>
              </div>

              <h3 className="text-base font-extrabold text-slate-900">{notice.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{notice.description}</p>
            </div>
          );
        })}
      </div>

      {/* Post Notice Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Post New Notice</h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="e.g. Science Exhibition Registration"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={newNotice.priority}
                  onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Description</label>
                <textarea
                  rows="4"
                  required
                  value={newNotice.description}
                  onChange={(e) => setNewNotice({ ...newNotice, description: e.target.value })}
                  placeholder="Enter notice details..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherNoticesPage;
