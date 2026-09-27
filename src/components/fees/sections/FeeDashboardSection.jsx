import React, { useState, useMemo } from 'react';
import { Users, AlertCircle, Wallet, CreditCard, Filter } from 'lucide-react';
import { formatCurrency, calculateFeeStatus } from '@/data/feeData';

export const FeeDashboardSection = ({
  students,
  studentFeeDues,
  onSelectStudentForCollection,
}) => {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Compute fee summary per student
  const studentSummaries = useMemo(() => {
    return students.map((student) => {
      const dues = studentFeeDues.filter((d) => d.studentId === student.id);
      const totalDue = dues.reduce((sum, d) => sum + (d.total || 0), 0);
      const totalPaid = dues.reduce((sum, d) => sum + (d.paid || 0), 0);
      const pending = Math.max(0, totalDue - totalPaid);

      // Determine overall status
      let oldestDueDate = null;
      dues.forEach((d) => {
        if (d.paid < d.total) {
          if (!oldestDueDate || new Date(d.dueDate) < new Date(oldestDueDate)) {
            oldestDueDate = d.dueDate;
          }
        }
      });

      const status = calculateFeeStatus(totalPaid, totalDue, oldestDueDate);

      return {
        ...student,
        totalDue,
        paid: totalPaid,
        pending,
        status,
        oldestDueDate,
      };
    });
  }, [students, studentFeeDues]);

  // Dashboard Summary Numbers
  const summaryMetrics = useMemo(() => {
    const totalStudents = studentSummaries.length;
    const paidStudents = studentSummaries.filter((s) => s.pending === 0).length;
    const pendingStudents = studentSummaries.filter((s) => s.pending > 0).length;

    const totalCollected = studentSummaries.reduce((sum, s) => sum + s.paid, 0);
    const totalPending = studentSummaries.reduce((sum, s) => sum + s.pending, 0);

    return {
      paidStudents,
      totalStudents,
      pendingStudents,
      totalCollected,
      totalPending,
    };
  }, [studentSummaries]);

  // Filtered Student List for Table
  const filteredStudents = useMemo(() => {
    return studentSummaries.filter((student) => {
      const matchesClass =
        selectedClass === 'All' || student.className === selectedClass;
      const matchesStatus =
        selectedStatus === 'All' ||
        student.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesClass && matchesStatus;
    });
  }, [studentSummaries, selectedClass, selectedStatus]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Paid Students (Green) */}
        <div className="bg-emerald-500 text-white rounded-3xl p-6 shadow-md shadow-emerald-500/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Paid Students
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold">{summaryMetrics.paidStudents}</h3>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              of {summaryMetrics.totalStudents} students
            </p>
          </div>
        </div>

        {/* Card 2: Pending Students (Orange) */}
        <div className="bg-[#FF6B2C] text-white rounded-3xl p-6 shadow-md shadow-[#FF6B2C]/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">
              Pending Students
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold">{summaryMetrics.pendingStudents}</h3>
            <p className="text-xs text-orange-100 font-medium mt-0.5">defaulters</p>
          </div>
        </div>

        {/* Card 3: Total Collected (Blue) */}
        <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-md shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
              Total Collected
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold">
              {formatCurrency(summaryMetrics.totalCollected)}
            </h3>
            <p className="text-xs text-indigo-100 font-medium mt-0.5">Total collected to date</p>
          </div>
        </div>

        {/* Card 4: Total Pending (Cyan/Teal) */}
        <div className="bg-cyan-500 text-white rounded-3xl p-6 shadow-md shadow-cyan-500/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-cyan-100 uppercase tracking-wider">
              Total Pending
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold">
              {formatCurrency(summaryMetrics.totalPending)}
            </h3>
            <p className="text-xs text-cyan-100 font-medium mt-0.5">Outstanding balance</p>
          </div>
        </div>
      </div>

      {/* Class-wise Fee Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header & Filter Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Class-wise Fee Status
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
            >
              <option value="All">All Classes</option>
              <option value="1-A">1-A</option>
              <option value="1-B">1-B</option>
              <option value="2-A">2-A</option>
              <option value="2-B">2-B</option>
              <option value="3-A">3-A</option>
              <option value="3-B">3-B</option>
              <option value="4-A">4-A</option>
              <option value="4-B">4-B</option>
              <option value="5-A">5-A</option>
              <option value="5-B">5-B</option>
              <option value="6-A">6-A</option>
              <option value="6-B">6-B</option>
              <option value="7-A">7-A</option>
              <option value="7-B">7-B</option>
              <option value="8-A">8-A</option>
              <option value="8-B">8-B</option>
              <option value="9-A">9-A</option>
              <option value="9-B">9-B</option>
              <option value="10-A">10-A</option>
              <option value="10-B">10-B</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Student Fee Table */}
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
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                    {/* Student Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100/70 text-[#FF6B2C] font-extrabold text-xs flex items-center justify-center shrink-0">
                          {st.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{st.name}</div>
                          <div className="text-[11px] text-slate-400">{st.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-4 px-6 font-semibold text-slate-700">{st.className}</td>

                    {/* Student ID */}
                    <td className="py-4 px-6 font-mono text-slate-600">{st.studentId}</td>

                    {/* Total Due */}
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {formatCurrency(st.totalDue)}
                    </td>

                    {/* Paid */}
                    <td className="py-4 px-6 font-bold text-emerald-600">
                      {st.paid > 0 ? formatCurrency(st.paid) : '—'}
                    </td>

                    {/* Pending */}
                    <td className="py-4 px-6 font-bold text-rose-600">
                      {st.pending > 0 ? formatCurrency(st.pending) : '—'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          st.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : st.status === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : st.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      {st.pending > 0 ? (
                        <button
                          type="button"
                          onClick={() => onSelectStudentForCollection(st)}
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
      </div>
    </div>
  );
};
