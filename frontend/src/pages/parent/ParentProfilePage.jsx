import React, { useState } from 'react';
import { User, Mail, Phone, CheckCircle2, Users, Info, Calendar, Droplet, MapPin } from 'lucide-react';
import { ParentContactEditor, StudentContactEditor } from '@/components/common/ContactEditors';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/utils';

export const ParentProfilePage = () => {
  const { currentUser, selectedChild, switchChild, refreshSession } = useAuth();
  const linkedChildren = currentUser?.linkedChildren || [];

  // Per-child attendance and fee figures come from the parent dashboard.
  const dashboard = useApi('/dashboard');
  const overviewFor = (studentId) => (dashboard.data?.children || []).find((c) => c.student?.id === studentId);

  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const statValue = (value) => {
    if (dashboard.loading) return '…';
    if (dashboard.error) return '—';
    return value;
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
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-orange-100 shrink-0">
            {currentUser?.avatar}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{currentUser?.name}</h2>
              {currentUser?.relation && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  {currentUser.relation}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Parent ID: <strong className="text-slate-800">{currentUser?.parentId}</strong> • {linkedChildren.length}{' '}
              {linkedChildren.length === 1 ? 'Child' : 'Children'} Enrolled
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 justify-center sm:justify-start">
              {currentUser?.email && (
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {currentUser.email}
                </span>
              )}
              {currentUser?.phone && (
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {currentUser.phone}
                </span>
              )}
              {currentUser?.loginEmail && currentUser.loginEmail !== currentUser.email && (
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Login: {currentUser.loginEmail}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {currentUser ? <ParentContactEditor parent={currentUser} onSaved={refreshSession} /> : null}
        <div className="flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            You can update your own phone and email, and each child&apos;s address and guardian contact below. To change
            linked children or other school records, please contact the school office.
          </p>
        </div>
      </div>

      {/* Enrolled Children Section */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#FF6B2C]" />
          <span>Enrolled Children in Shiv Shanti Adarsh Academy</span>
        </h3>

        {linkedChildren.length === 0 && (
          <p className="text-sm text-slate-500">No children are linked to this account yet.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {linkedChildren.map((child) => {
            const isSelected = selectedChild?.studentId === child.studentId;
            const overview = overviewFor(child.studentId);
            const rate = overview?.attendance?.rate;
            return (
              <div
                key={child.studentId}
                className={`bg-white rounded-3xl border transition-all p-6 space-y-4 ${
                  isSelected ? 'border-[#FF6B2C] ring-2 ring-[#FF6B2C]/20 shadow-sm' : 'border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#EA580C] font-black text-base flex items-center justify-center">
                      {child.avatar}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{child.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Roll #{child.rollNumber} • ID: {child.studentId}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 shrink-0">
                    Class {child.className}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> DOB: {formatDate(child.dateOfBirth)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {child.gender || '—'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-slate-400" /> Blood group: {child.bloodGroup || '—'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Admitted: {formatDate(child.admissionDate)}
                  </span>
                  {child.address && (
                    <span className="col-span-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {child.address}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="text-xs font-bold text-[#EA580C]">
                      {statValue(rate == null ? '—' : `${rate}%`)}
                    </div>
                    <div className="text-[10px] text-slate-400">Attendance</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="text-xs font-bold text-purple-700">
                      {statValue(overview ? overview.upcomingExams?.length ?? 0 : '—')}
                    </div>
                    <div className="text-[10px] text-slate-400">Upcoming Papers</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="text-xs font-bold text-emerald-600">
                      {statValue(overview?.fees ? formatCurrency(overview.fees.pending) : '—')}
                    </div>
                    <div className="text-[10px] text-slate-400">Pending Fee</div>
                  </div>
                </div>

                <StudentContactEditor student={child} onSaved={refreshSession} />

                <button
                  onClick={() => {
                    switchChild(child.studentId);
                    triggerToast(`Switched active child view to ${child.name}.`);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? '✓ Currently Selected Child' : `Switch to ${child.name}`}
                </button>
              </div>
            );
          })}
        </div>
        {dashboard.error && (
          <p className="text-xs text-rose-600">Could not load attendance and fee figures: {dashboard.error.message}</p>
        )}
      </div>
    </div>
  );
};

export default ParentProfilePage;
