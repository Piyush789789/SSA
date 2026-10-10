import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Calendar,
  Award,
  Heart,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Edit3,
  X,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const StudentProfilePage = () => {
  const { currentUser } = useAuth();

  const studentName = currentUser?.name || 'Rohit Verma';
  const studentId = currentUser?.studentId || 'STU-2026-0503';
  const className = currentUser?.className || '5-B';
  const section = currentUser?.section || 'B';
  const rollNumber = currentUser?.rollNumber || 3;
  const avatar = currentUser?.avatar || 'RV';
  const classTeacher = currentUser?.classTeacher || 'Anjali Singh';
  const bloodGroup = currentUser?.bloodGroup || 'B+';
  const dob = currentUser?.dob || 'Mar 15, 2015';

  const [parentInfo, setParentInfo] = useState({
    name: currentUser?.parent?.name || 'Sanjay Verma',
    relation: currentUser?.parent?.relation || 'Father',
    phone: currentUser?.parent?.phone || '+91 98765 12345',
    email: currentUser?.parent?.email || 'sanjay.verma@example.com',
    address: 'Flat 402, Sunshine Heights, New Delhi - 110025',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveParentInfo = (e) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    triggerToast('Emergency contact details updated successfully.');
  };

  const handlePrintIdCard = () => {
    window.print();
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
            Student Profile
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Personal, academic, and guardian records for {studentName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-2xl transition-all shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            Update Contact Info
          </button>
          <button
            onClick={handlePrintIdCard}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-sm shadow-[#FF6B2C]/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Student ID
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar Circle */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-orange-100 shrink-0">
            {avatar}
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{studentName}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                Active Student
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Roll No: <strong className="text-slate-800">#{rollNumber}</strong> • Class: <strong className="text-slate-800">{className}</strong> • Admission ID: <strong className="text-slate-800">{studentId}</strong>
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Class Teacher: {classTeacher}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Blood Group: {bloodGroup}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Badges */}
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3.5 text-center min-w-[120px]">
            <div className="text-xl font-bold text-[#EA580C]">92%</div>
            <div className="text-[11px] font-semibold text-slate-500">Attendance Rate</div>
          </div>
          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5 text-center min-w-[120px]">
            <div className="text-xl font-bold text-purple-700">A (87.2%)</div>
            <div className="text-[11px] font-semibold text-slate-500">Academic Score</div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Details */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
            <BookOpen className="w-5 h-5 text-[#FF6B2C]" />
            <h3>Academic Information</h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Academic Year</span>
              <span className="font-bold text-slate-800">2025 - 2026</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Current Class</span>
              <span className="font-bold text-slate-800">Grade {className}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Section</span>
              <span className="font-bold text-slate-800">{section}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Roll Number</span>
              <span className="font-bold text-slate-800">{rollNumber}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Date of Birth</span>
              <span className="font-bold text-slate-800">{dob}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">School House</span>
              <span className="font-bold text-amber-600">Surya House (Yellow)</span>
            </div>
          </div>
        </div>

        {/* Guardian & Contact Details */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h3>Parent / Guardian Details</h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Guardian Name</span>
              <span className="font-bold text-slate-800">{parentInfo.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Relationship</span>
              <span className="font-bold text-slate-800">{parentInfo.relation}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Phone Number</span>
              <span className="font-bold text-slate-800">{parentInfo.phone}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Guardian Email</span>
              <span className="font-bold text-slate-800 truncate max-w-[160px]">{parentInfo.email}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Residential Address</span>
              <span className="font-bold text-slate-800 text-right max-w-[160px] text-xs">
                {parentInfo.address}
              </span>
            </div>
          </div>
        </div>

        {/* Fee & Administrative Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3>Fee & Accounts Status</h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Total Annual Fee</span>
              <span className="font-bold text-slate-800">₹10,700</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Total Paid</span>
              <span className="font-bold text-emerald-600">₹7,700</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Pending Dues</span>
              <span className="font-bold text-rose-600">₹3,000</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Next Due Date</span>
              <span className="font-bold text-amber-600">April 10, 2026</span>
            </div>
            <div className="pt-2">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '72%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                <span>72% Paid</span>
                <span>Term 2 Cleared</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Emergency Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Update Guardian Contact Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParentInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={parentInfo.name}
                  onChange={(e) => setParentInfo({ ...parentInfo, name: e.target.value })}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 px-3.5 focus:outline-none focus:border-[#FF6B2C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={parentInfo.phone}
                  onChange={(e) => setParentInfo({ ...parentInfo, phone: e.target.value })}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 px-3.5 focus:outline-none focus:border-[#FF6B2C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Email</label>
                <input
                  type="email"
                  value={parentInfo.email}
                  onChange={(e) => setParentInfo({ ...parentInfo, email: e.target.value })}
                  className="w-full h-11 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 px-3.5 focus:outline-none focus:border-[#FF6B2C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={parentInfo.address}
                  onChange={(e) => setParentInfo({ ...parentInfo, address: e.target.value })}
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

export default StudentProfilePage;
