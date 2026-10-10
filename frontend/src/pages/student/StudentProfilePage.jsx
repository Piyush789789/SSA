import React from 'react';
import { User, BookOpen, GraduationCap, Heart, ShieldCheck, Printer, CreditCard, Info } from 'lucide-react';
import { StudentContactEditor } from '@/components/common/ContactEditors';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, formatDate, initialsOf } from '@/utils';

const Row = ({ label, children, last = false, valueClass = 'text-slate-800' }) => (
  <div className={`flex justify-between gap-3 py-1.5 ${last ? '' : 'border-b border-slate-50'}`}>
    <span className="text-slate-500 font-medium shrink-0">{label}</span>
    <span className={`font-bold text-right break-words min-w-0 ${valueClass}`}>{children || '—'}</span>
  </div>
);

export const StudentProfilePage = () => {
  const { currentUser, refreshSession } = useAuth();

  const studentId = currentUser?.studentId || currentUser?.id;
  const className = currentUser?.className;
  const guardian = currentUser?.guardian || currentUser?.parent || {};

  const classInfo = useApi(className ? `/classes/${encodeURIComponent(className)}` : null);
  const meta = useApi('/meta');
  const attendance = useApi(studentId ? `/attendance/students/${studentId}/stats` : null);
  const results = useApi(studentId ? `/results/students/${studentId}` : null);
  const fees = useApi(studentId ? `/fees/students/${studentId}/summary` : null);

  const nextDue = (fees.data?.dues || [])
    .filter((d) => d.pending > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const paidPct = fees.data?.total > 0 ? Math.round((fees.data.paid / fees.data.total) * 100) : null;

  const loadingOr = (state, value) => (state.error ? 'Unavailable' : state.data == null ? '…' : value);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-7 h-7 text-[#FF6B2C]" />
            Student Profile
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Personal, academic, and guardian records for {currentUser?.name}.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-sm shadow-[#FF6B2C]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          Print Profile
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#E04E15] text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-orange-100 shrink-0">
            {currentUser?.avatar || initialsOf(currentUser?.name || '')}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{currentUser?.name}</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Roll No: <strong className="text-slate-800">#{currentUser?.rollNumber ?? '—'}</strong> • Class:{' '}
              <strong className="text-slate-800">{className || '—'}</strong> • Admission ID:{' '}
              <strong className="text-slate-800">{studentId}</strong>
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Class Teacher:{' '}
                {loadingOr(classInfo, classInfo.data?.classTeacherName || 'Not assigned')}
              </span>
              {currentUser?.bloodGroup && (
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl font-medium">
                  <Heart className="w-3.5 h-3.5 text-rose-500" /> Blood Group: {currentUser.bloodGroup}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3.5 text-center min-w-[120px]">
            <div className="text-xl font-bold text-[#EA580C]">
              {loadingOr(attendance, attendance.data?.rate != null ? `${attendance.data.rate}%` : '—')}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">Attendance Rate</div>
          </div>
          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5 text-center min-w-[120px]">
            <div className="text-xl font-bold text-purple-700">
              {loadingOr(
                results,
                results.data?.percentage != null ? `${results.data.grade} (${results.data.percentage}%)` : '—',
              )}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">Academic Score</div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
            <BookOpen className="w-5 h-5 text-[#FF6B2C]" />
            <h3>Academic Information</h3>
          </div>
          <div className="space-y-3 text-xs sm:text-sm">
            <Row label="Academic Year">{meta.data?.academicYear || classInfo.data?.academicYear}</Row>
            <Row label="Current Class">{className}</Row>
            <Row label="Section">{currentUser?.section}</Row>
            <Row label="Roll Number">{currentUser?.rollNumber != null ? String(currentUser.rollNumber) : null}</Row>
            <Row label="Room">{classInfo.data?.room}</Row>
            <Row label="Date of Birth">{currentUser?.dateOfBirth ? formatDate(currentUser.dateOfBirth) : null}</Row>
            <Row label="Gender">{currentUser?.gender}</Row>
            <Row label="Admission Date" last>
              {currentUser?.admissionDate ? formatDate(currentUser.admissionDate) : null}
            </Row>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h3>Parent / Guardian Details</h3>
          </div>
          <div className="space-y-3 text-xs sm:text-sm">
            <Row label="Guardian Name">{guardian.name}</Row>
            <Row label="Relationship">{guardian.relation}</Row>
            <Row label="Phone Number">{guardian.phone}</Row>
            <Row label="Guardian Email">{guardian.email}</Row>
            <Row label="Student Email">{currentUser?.email}</Row>
            <Row label="Residential Address" last>
              {currentUser?.address}
            </Row>
          </div>
          {currentUser ? <StudentContactEditor student={currentUser} onSaved={refreshSession} /> : null}
          <p className="flex items-start gap-1.5 text-[11px] text-slate-400 pt-1">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
            You can update the address and guardian phone/email. For other changes, contact the school office.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-slate-900 font-bold">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3>Fee & Accounts Status</h3>
          </div>
          {fees.error ? (
            <p className="text-xs text-red-600">{fees.error.message}</p>
          ) : !fees.data ? (
            <p className="text-xs text-slate-400">Loading…</p>
          ) : (
            <div className="space-y-3 text-xs sm:text-sm">
              <Row label="Total Fee">{formatCurrency(fees.data.total)}</Row>
              <Row label="Total Paid" valueClass="text-emerald-600">
                {formatCurrency(fees.data.paid)}
              </Row>
              <Row label="Pending Dues" valueClass="text-rose-600">
                {formatCurrency(fees.data.pending)}
              </Row>
              <Row label="Next Due Date" valueClass="text-amber-600" last>
                {nextDue ? `${formatDate(nextDue.dueDate)} (${nextDue.title})` : 'No pending dues'}
              </Row>
              {paidPct != null && (
                <div className="pt-2">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${paidPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                    <span>{paidPct}% Paid</span>
                    {fees.data.overdue > 0 && <span className="text-rose-500">{formatCurrency(fees.data.overdue)} overdue</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
