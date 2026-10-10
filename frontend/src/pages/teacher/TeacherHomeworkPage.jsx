import React, { useState, useMemo } from 'react';
import { BookOpenCheck, Plus, Search, Eye, Edit3, Trash2, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { http } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { formatDate, todayIso } from '@/utils';

const emptyForm = (className, subject) => ({
  title: '',
  description: '',
  className: className ?? '',
  subject: subject ?? '',
  dueDate: '',
  instructions: '',
  attachments: '',
});

export const TeacherHomeworkPage = () => {
  const { currentUser } = useAuth();
  const homework = useApi('/homework');

  const assignedClasses = useMemo(() => currentUser?.assignedClasses ?? [], [currentUser]);
  const teacherSubjects = useMemo(() => currentUser?.subjects ?? [], [currentUser]);
  const today = todayIso();

  // Filters
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Toast
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [viewingHomework, setViewingHomework] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState(() => emptyForm(assignedClasses[0], teacherSubjects[0]));

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Only the signed-in teacher's own homework.
  const filteredHomework = useMemo(() => {
    return (homework.data ?? [])
      .filter((hw) => {
        if (hw.teacherId !== currentUser?.id) return false;
        if (selectedClass !== 'ALL' && hw.className !== selectedClass) return false;
        if (selectedSubject !== 'ALL' && hw.subject !== selectedSubject) return false;
        if (selectedStatus === 'Open' && hw.dueDate < today) return false;
        if (selectedStatus === 'Closed' && hw.dueDate >= today) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const titleMatch = (hw.title ?? '').toLowerCase().includes(q);
          const descMatch = (hw.description ?? '').toLowerCase().includes(q);
          if (!titleMatch && !descMatch) return false;
        }
        return true;
      })
      .sort((a, b) => (a.dueDate < b.dueDate ? 1 : a.dueDate > b.dueDate ? -1 : 0));
  }, [homework.data, currentUser, selectedClass, selectedSubject, selectedStatus, searchQuery, today]);

  const handleOpenCreateModal = () => {
    setEditingHomework(null);
    setFormData(emptyForm(assignedClasses[0], teacherSubjects[0]));
    setFormError('');
    setIsAssignModalOpen(true);
  };

  const handleOpenEditModal = (hw) => {
    setEditingHomework(hw);
    setFormData({
      title: hw.title ?? '',
      description: hw.description ?? '',
      className: hw.className,
      subject: hw.subject,
      dueDate: hw.dueDate ?? '',
      instructions: hw.instructions || '',
      attachments: hw.attachments?.join(', ') || '',
    });
    setFormError('');
    setIsAssignModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) {
      setFormError('Please fill out all required fields.');
      return;
    }
    const body = {
      title: formData.title.trim(),
      description: formData.description,
      subject: formData.subject,
      className: formData.className,
      dueDate: formData.dueDate,
      instructions: formData.instructions,
      attachments: formData.attachments
        ? formData.attachments.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };
    setSaving(true);
    setFormError('');
    try {
      if (editingHomework) {
        await http.put(`/homework/${encodeURIComponent(editingHomework.id)}`, body);
        triggerToast('Homework updated successfully.');
      } else {
        await http.post('/homework', body);
        triggerToast('New homework assigned successfully.');
      }
      setIsAssignModalOpen(false);
      homework.reload();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this homework?')) return;
    setDeletingId(id);
    setActionError('');
    try {
      await http.delete(`/homework/${encodeURIComponent(id)}`);
      triggerToast('Homework deleted.');
      homework.reload();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpenCheck className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
            <span>Homework & Assignments</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Create, track, and evaluate homework assigned to your classes
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Assign Homework</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search homework title..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF6B2C]"
            />
          </div>

          {/* Class Filter (Restricted to teacher's classes) */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Assigned Classes</option>
            {assignedClasses.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>

          {/* Subject Filter (Restricted to teacher's subjects) */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Subjects</option>
            {teacherSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open (due today or later)</option>
            <option value="Closed">Past due</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Showing {filteredHomework.length} items
        </span>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">{actionError}</div>
      )}

      {/* Homework Cards & Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <AsyncState state={homework} loadingText="Loading homework…">
        {() => (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Title & Description</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Assigned / Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHomework.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No homework found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredHomework.map((hw) => (
                  <tr key={hw.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{hw.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{hw.description}</p>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-700">{hw.subject}</td>

                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-1 bg-orange-100/80 text-[#FF6B2C] rounded-lg font-bold text-xs">
                        {hw.className}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-[11px]">
                        <p className="text-slate-500">Assigned: {formatDate(hw.assignedDate)}</p>
                        <p className="font-bold text-slate-800">Due: {formatDate(hw.dueDate)}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {hw.dueDate >= today ? (
                        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px]">
                          Open
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-[11px]">
                          Past due
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingHomework(hw)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 stroke-[2]" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(hw)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Homework"
                        >
                          <Edit3 className="w-4 h-4 stroke-[2]" />
                        </button>

                        <button
                          onClick={() => handleDelete(hw.id)}
                          disabled={deletingId === hw.id}
                          className="disabled:opacity-40 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Homework"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
        </AsyncState>
      </div>

      {/* Assign / Edit Homework Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingHomework ? 'Edit Homework' : 'Assign New Homework'}
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Fractions Practice"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                  >
                    {assignedClasses.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                  >
                    {teacherSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={editingHomework ? undefined : today}
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide homework instructions or topic summary..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions / Submission Note
                </label>
                <input
                  type="text"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g. Show all calculation steps clearly."
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attachment names (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.attachments}
                  onChange={(e) => setFormData({ ...formData, attachments: e.target.value })}
                  placeholder="e.g. worksheet-4.pdf"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
                <p className="text-[10px] text-slate-400 mt-1">File upload is not available yet. Only the names are saved.</p>
              </div>

              {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="disabled:opacity-50 px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer"
                >
                  {saving ? 'Saving…' : editingHomework ? 'Save Changes' : 'Assign Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Homework Modal */}
      {viewingHomework && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-2.5 py-1 bg-orange-100 text-[#FF6B2C] font-bold rounded-lg text-xs">
                Class {viewingHomework.className} • {viewingHomework.subject}
              </span>
              <button
                onClick={() => setViewingHomework(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{viewingHomework.title}</h3>

            <div className="bg-slate-50 p-3.5 rounded-2xl text-xs text-slate-700 space-y-2">
              <p><strong>Description:</strong> {viewingHomework.description}</p>
              <p><strong>Instructions:</strong> {viewingHomework.instructions || 'None'}</p>
              <p><strong>Assigned:</strong> {formatDate(viewingHomework.assignedDate)} | <strong>Due:</strong> {formatDate(viewingHomework.dueDate)}</p>
              <p><strong>Attachments:</strong> {viewingHomework.attachments?.length ? viewingHomework.attachments.join(', ') : 'None'}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingHomework(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
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

export default TeacherHomeworkPage;
