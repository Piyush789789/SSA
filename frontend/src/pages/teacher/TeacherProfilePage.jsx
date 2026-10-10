import React, { useState } from 'react';
import { User, Mail, Phone, GraduationCap, Calendar, Award, Edit3, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { http } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { formatDate, initialsOf } from '@/utils';

export const TeacherProfilePage = () => {
  const { currentUser, refreshSession } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', qualification: '', experience: '' });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await http.put('/me/teacher-profile', editForm);
      await refreshSession();
      setIsEditModalOpen(false);
      triggerToast('Profile saved.');
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  };

  const teacherName = currentUser?.name ?? '';
  const teacherId = currentUser?.teacherId ?? currentUser?.id;
  const teacherEmail = currentUser?.email || '—';
  const teacherPhone = currentUser?.phone || '—';
  const qualification = currentUser?.qualification || '—';
  const experience = currentUser?.experience || '—';
  const joiningDate = currentUser?.joiningDate;
  const assignedClasses = currentUser?.assignedClasses ?? [];
  const subjects = currentUser?.subjects ?? [];
  const avatar = currentUser?.avatar || initialsOf(teacherName);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar Circle */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-orange-100 shrink-0">
            {avatar}
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 bg-orange-100 text-[#FF6B2C] font-bold rounded-full text-xs">
                {teacherId}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-full text-xs">
                Teacher
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              {teacherName}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              {subjects.length ? subjects.join(' & ') : 'No subjects assigned'}
              {currentUser?.loginEmail ? ` • Login: ${currentUser.loginEmail}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditForm({
              name: teacherName,
              email: currentUser?.email ?? '',
              phone: currentUser?.phone ?? '',
              qualification: currentUser?.qualification ?? '',
              experience: currentUser?.experience ?? '',
            });
            setIsEditModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer shrink-0"
        >
          <Edit3 className="w-4 h-4 stroke-[2]" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Contact Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-[#FF6B2C]" />
            <span>Personal & Contact Details</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Address:
              </span>
              <span className="font-bold text-slate-900">{teacherEmail}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                Phone Number:
              </span>
              <span className="font-bold text-slate-900">{teacherPhone}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Date of Joining:
              </span>
              <span className="font-bold text-slate-900">{formatDate(joiningDate)}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-400" />
                Total Experience:
              </span>
              <span className="font-bold text-slate-900">{experience}</span>
            </div>
          </div>
        </div>

        {/* Academic Assignments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#FF6B2C]" />
            <span>Academic Qualifications & Assignments</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Educational Qualification:</span>
              <span className="font-extrabold text-slate-900 text-sm bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 inline-block">
                {qualification}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1.5">Assigned Subjects:</span>
              <div className="flex flex-wrap gap-2">
                {subjects.length === 0 && <span className="text-slate-400">None</span>}
                {subjects.map((sub) => (
                  <span
                    key={sub}
                    className="px-3 py-1 bg-orange-100 text-[#FF6B2C] font-bold rounded-xl text-xs"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1.5">Assigned Classes:</span>
              <div className="flex flex-wrap gap-2">
                {assignedClasses.length === 0 && <span className="text-slate-400">None</span>}
                {assignedClasses.map((cls) => (
                  <span
                    key={cls}
                    className="px-3 py-1 bg-slate-900 text-white font-bold rounded-xl text-xs"
                  >
                    Class {cls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Teacher Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] font-semibold text-slate-500">
              Subjects and classes are assigned by the administrator and cannot be changed here.
            </p>
            {saveError ? (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{saveError.message}</span>
              </div>
            ) : null}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Experience</label>
                <input
                  type="text"
                  value={editForm.experience}
                  onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] disabled:opacity-60 text-white font-bold rounded-2xl text-xs shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfilePage;
