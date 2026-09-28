import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  X,
  MapPin,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const ParentProfilePage = () => {
  const { currentUser, selectedChild, switchChild } = useAuth();

  const linkedChildren = currentUser?.linkedChildren || [];
  const parentName = currentUser?.name || 'Rajesh Verma';
  const parentEmail = currentUser?.email || 'parent075.stu20260081@alfalah.edu';
  const parentPhone = currentUser?.phone || '+91 98765 43210';

  const [contactInfo, setContactInfo] = useState({
    name: parentName,
    email: parentEmail,
    phone: parentPhone,
    address: 'Flat 402, Sunshine Heights, New Delhi - 110025',
    occupation: 'Senior Software Engineer',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveContactInfo = (e) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    triggerToast('Parent contact information updated successfully.');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-7 h-7 text-[#FF6B2C]" />
            Parent Account & Profile
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Guardian records and enrolled children summary.
          </p>
        </div>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-2xl transition-all shadow-2xs cursor-pointer"
        >
          <Edit3 className="w-4 h-4 text-slate-500" />
          Update Contact Info
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-orange-100 shrink-0">
            {currentUser?.avatar || 'RV'}
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{contactInfo.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                Verified Guardian
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Parent ID: <strong className="text-slate-800">{currentUser?.parentId || 'PRN-2026-001'}</strong> •{' '}
              {linkedChildren.length} Children Enrolled
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {contactInfo.email}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {contactInfo.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Children Section */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#FF6B2C]" />
          <span>Enrolled Children in Shiv Shanti Adarsh Academy</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {linkedChildren.map((child) => {
            const isSelected = selectedChild?.studentId === child.studentId;
            return (
              <div
                key={child.studentId}
                className={`bg-white rounded-3xl border transition-all p-6 space-y-4 ${
                  isSelected
                    ? 'border-[#FF6B2C] ring-2 ring-[#FF6B2C]/20 shadow-sm'
                    : 'border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#EA580C] font-black text-base flex items-center justify-center">
                      {child.avatar}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{child.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Grade {child.className} • Roll #{child.rollNumber} • ID: {child.studentId}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    Class {child.className}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="text-xs font-bold text-[#EA580C]">{child.attendanceStats?.rate}%</div>
                    <div className="text-[10px] text-slate-400">Attendance</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="text-xs font-bold text-purple-700">{child.academicStats?.average}%</div>
                    <div className="text-[10px] text-slate-400">Avg Score</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="text-xs font-bold text-emerald-600">₹{child.feeSummary?.pending?.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">Pending Fee</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    switchChild(child.studentId);
                    triggerToast(`Switched active child view to ${child.name}.`);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF6B2C] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? '✓ Currently Selected Child' : `Switch to ${child.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Guardian Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Update Guardian Contact</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContactInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 px-3.5 focus:outline-none focus:border-[#FF6B2C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 px-3.5 focus:outline-none focus:border-[#FF6B2C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Email</label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 px-3.5 focus:outline-none focus:border-[#FF6B2C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={contactInfo.address}
                  onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 p-3 focus:outline-none focus:border-[#FF6B2C] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentProfilePage;
