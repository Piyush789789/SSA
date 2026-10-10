import React, { useMemo, useState } from 'react';
import { Users, AlertCircle, Wallet, CreditCard } from 'lucide-react';
import { withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { formatCurrency, formatDate, initialsOf } from '@/utils';
import { groupDuesByStudent, statusBadgeClass } from '@/components/fees/feeHelpers';

const STATUSES = ['Paid', 'Pending', 'Partial', 'Overdue'];

export const FeeDashboardSection = ({ classes = [], onSelectStudentForCollection }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const overview = useApi(withQuery('/fees/overview', { className: selectedClass }));
  const dues = useApi(withQuery('/fees/dues', { className: selectedClass, status: selectedStatus }));

  const students = useMemo(() => groupDuesByStudent(dues.data || []), [dues.data]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards Grid */}
      <AsyncState state={overview} loadingText="Loading fee overview…">
        {(o) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-emerald-500 text-white rounded-3xl p-6 shadow-md shadow-emerald-500/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Paid Students</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold">{o.fullyPaidStudents}</h3>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">
                  of {o.fullyPaidStudents + o.studentsWithDues} students
                </p>
              </div>
            </div>

            <div className="bg-[#FF6B2C] text-white rounded-3xl p-6 shadow-md shadow-[#FF6B2C]/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">Pending Students</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold">{o.studentsWithDues}</h3>
                <p className="text-xs text-orange-100 font-medium mt-0.5">
                  {formatCurrency(o.overdue)} overdue
                </p>
              </div>
            </div>

            <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-md shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Total Collected</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold">{formatCurrency(o.collected)}</h3>
                <p className="text-xs text-indigo-100 font-medium mt-0.5">
                  {formatCurrency(o.collectedToday)} today ({o.paymentsToday} payments)
                </p>
              </div>
            </div>

            <div className="bg-cyan-500 text-white rounded-3xl p-6 shadow-md shadow-cyan-500/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-cyan-100 uppercase tracking-wider">Total Pending</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold">{formatCurrency(o.pending)}</h3>
                <p className="text-xs text-cyan-100 font-medium mt-0.5">
                  of {formatCurrency(o.expected)} expected
                  {o.concessions ? ` · ${formatCurrency(o.concessions)} concessions` : ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </AsyncState>

      {/* Class-wise Fee Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Class-wise Fee Status</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>Has {s} dues</option>
              ))}
            </select>
          </div>
        </div>

        <AsyncState state={dues} loadingText="Loading dues…">
          {() => (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">STUDENT</th>
                    <th className="py-3.5 px-6">CLASS</th>
                    <th className="py-3.5 px-6">STUDENT ID</th>
                    <th className="py-3.5 px-6">TOTAL DUE</th>
                    <th className="py-3.5 px-6">PAID</th>
                    <th className="py-3.5 px-6">PENDING</th>
                    <th className="py-3.5 px-6">STATUS</th>
                    <th className="py-3.5 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length > 0 ? (
                    students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100/70 text-[#FF6B2C] font-extrabold text-xs flex items-center justify-center shrink-0">
                              {initialsOf(st.name)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{st.name}</div>
                              {st.oldestDueDate && (
                                <div className="text-[11px] text-slate-400">Oldest due {formatDate(st.oldestDueDate)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700">{st.className}</td>
                        <td className="py-4 px-6 font-mono text-slate-600">{st.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">{formatCurrency(st.totalDue)}</td>
                        <td className="py-4 px-6 font-bold text-emerald-600">{st.paid > 0 ? formatCurrency(st.paid) : '—'}</td>
                        <td className="py-4 px-6 font-bold text-rose-600">{st.pending > 0 ? formatCurrency(st.pending) : '—'}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusBadgeClass(st.status)}`}>
                            {st.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {st.pending > 0 ? (
                            <button
                              type="button"
                              onClick={() => onSelectStudentForCollection({ id: st.id, name: st.name, className: st.className })}
                              className="px-4 py-1.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              Collect
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Clear</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </AsyncState>
      </div>
    </div>
  );
};
