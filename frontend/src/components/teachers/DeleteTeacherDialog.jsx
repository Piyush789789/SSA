import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/** `onConfirm(teacher)` returns a promise (DELETE /teachers/{id}); its error message is shown here. */
export const DeleteTeacherDialog = ({ isOpen, teacher, onClose, onConfirm }) => {
  if (!isOpen || !teacher) return null;
  return <DeleteTeacherContent key={teacher.id} teacher={teacher} onClose={onClose} onConfirm={onConfirm} />;
};

const DeleteTeacherContent = ({ teacher, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await onConfirm(teacher);
    } catch (err) {
      setError(err.message || 'Could not delete the teacher.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Delete Teacher?</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Are you sure you want to remove <span className="font-semibold text-slate-700">{teacher.name}</span> ({teacher.id})?
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600">
          This permanently deletes the teacher record from the school database.
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs font-medium text-rose-700">{error}</div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
