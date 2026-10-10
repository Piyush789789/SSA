import React, { useState, useMemo } from 'react';
import { Megaphone, Calendar, User, Search, Plus, X, Edit3, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatDateTime } from '@/utils';
import { useI18n } from '@/i18n/translate';

const AUDIENCE_LABELS = { ALL: 'Everyone', STAFF: 'Staff', STUDENTS: 'Students', PARENTS: 'Parents' };

const blankNotice = (audience = 'ALL') => ({ title: '', description: '', priority: 'medium', audience });

export const TeacherNoticesPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const notices = useApi('/notices');
  const meta = useApi('/meta');
  const audiences = meta.data?.noticeAudiences ?? Object.keys(AUDIENCE_LABELS);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [form, setForm] = useState(blankNotice);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  // The server returns notices newest first.
  const filteredNotices = useMemo(() => {
    return (notices.data ?? []).filter((notice) => {
      if (priorityFilter !== 'ALL' && notice.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (notice.title ?? '').toLowerCase().includes(q);
        const matchDesc = (notice.description ?? '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [notices.data, priorityFilter, searchQuery]);

  const openCreate = () => {
    setEditingNotice(null);
    setForm(blankNotice(audiences[0]));
    setFormError('');
    setIsPostModalOpen(true);
  };

  const openEdit = (notice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      description: notice.description,
      priority: notice.priority,
      audience: notice.audience,
    });
    setFormError('');
    setIsPostModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    setFormError('');
    const body = { ...form, title: form.title.trim(), description: form.description.trim() };
    try {
      if (editingNotice) {
        await http.put(`/notices/${encodeURIComponent(editingNotice.id)}`, body);
      } else {
        await http.post('/notices', body);
      }
      setIsPostModalOpen(false);
      notices.reload();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (notice) => {
    if (!window.confirm(`Delete the notice "${notice.title}"?`)) return;
    setActionError('');
    try {
      await http.delete(`/notices/${encodeURIComponent(notice.id)}`);
      notices.reload();
    } catch (error) {
      setActionError(error.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>{tx('Notice Board')}</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            School-wide announcements, circulars, and class notices
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Post Notice</span>
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

      {actionError && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">{actionError}</div>
      )}

      {/* Notices List Cards */}
      <AsyncState state={notices} loadingText="Loading notices…">
        {() =>
          filteredNotices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80">
              <EmptyMessage text="No notices match your filters." />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => {
                let priorityClass = 'bg-blue-50 text-blue-700 border-blue-200';
                if (notice.priority === 'high') priorityClass = 'bg-rose-50 text-rose-700 border-rose-200';
                if (notice.priority === 'medium') priorityClass = 'bg-amber-50 text-amber-700 border-amber-200';
                const isMine = notice.authorId === currentUser?.id;

                return (
                  <div
                    key={notice.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-orange-200 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border capitalize ${priorityClass}`}>
                          {notice.priority} Priority
                        </span>
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {AUDIENCE_LABELS[notice.audience] ?? notice.audience}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 stroke-[2]" />
                          <span>{isMine ? 'You' : notice.authorName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 stroke-[2]" />
                          <span>{formatDateTime(notice.createdAt)}</span>
                        </span>
                        {isMine && (
                          <span className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(notice)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer"
                              title="Edit notice"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(notice)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                              title="Delete notice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{notice.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">{notice.description}</p>
                  </div>
                );
              })}
            </div>
          )
        }
      </AsyncState>

      {/* Post / Edit Notice Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">{editingNotice ? 'Edit Notice' : 'Post New Notice'}</h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Science Exhibition Registration"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                  >
                    {audiences.map((a) => (
                      <option key={a} value={a}>
                        {AUDIENCE_LABELS[a] ?? a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Description</label>
                <textarea
                  rows="4"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter notice details..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  {tx('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? tx('Saving…') : tx(editingNotice ? 'Save Changes' : 'Publish Notice')}
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
