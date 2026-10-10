import React, { useState } from 'react';
import { X, Megaphone } from 'lucide-react';

const DEFAULT_AUDIENCES = ['ALL', 'STAFF', 'STUDENTS', 'PARENTS'];
const AUDIENCE_LABELS = {
  ALL: 'Everyone',
  STAFF: 'Staff only',
  STUDENTS: 'Students',
  PARENTS: 'Parents',
};

/**
 * Create / edit a notice. `onSave({title, description, priority, audience})` returns a promise
 * (POST/PUT /notices); its error message is shown. The author is set by the server.
 */
export const NoticeFormModal = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <NoticeForm key={props.noticeToEdit?.id || 'new'} {...props} />;
};

const NoticeForm = ({ noticeToEdit, audiences, onClose, onSave }) => {
  const isEditing = Boolean(noticeToEdit);
  const [formData, setFormData] = useState(() => ({
    title: noticeToEdit?.title || '',
    description: noticeToEdit?.description || '',
    priority: (noticeToEdit?.priority || 'medium').toLowerCase(),
    audience: noticeToEdit?.audience || 'ALL',
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const audienceOptions = audiences && audiences.length ? audiences : DEFAULT_AUDIENCES;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    try {
      await onSave({
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        audience: formData.audience,
      });
    } catch (error) {
      setServerError(error.message || 'Could not save the notice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <Megaphone className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {isEditing ? 'Edit Notice' : 'Create New Notice'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1">
          {serverError && (
            <div className="bg-rose-50 text-rose-700 text-xs font-medium p-3 rounded-xl border border-rose-200">
              {serverError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Notice title"
              className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-500 font-medium">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write notice details..."
              className={`w-full px-4 py-3 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                errors.description
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
              }`}
            />
            {errors.description && <p className="text-xs text-rose-500 font-medium">{errors.description}</p>}
          </div>

          {/* Priority & Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 font-medium focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Audience</label>
              <select
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 font-medium focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
              >
                {audienceOptions.map((a) => (
                  <option key={a} value={a}>
                    {AUDIENCE_LABELS[a] || a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer"
            >
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
