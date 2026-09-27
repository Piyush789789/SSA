import React, { useState, useMemo } from 'react';
import { Search, X, Plus, CreditCard, Receipt, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency, calculateFeeStatus } from '@/data/feeData';

export const CollectFeeSection = ({
  students,
  studentFeeDues,
  feeHeads,
  transactions,
  selectedStudent: externalSelectedStudent,
  onClearExternalStudent,
  onOpenCollectModal,
  onOpenReceiptModal,
  onAddInvoiceForStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [activeStudent, setActiveStudent] = useState(externalSelectedStudent || null);

  // Sync external selected student
  React.useEffect(() => {
    if (externalSelectedStudent) {
      setActiveStudent(externalSelectedStudent);
    }
  }, [externalSelectedStudent]);

  // Search Results dropdown
  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (query.length < 2) return [];

    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(query) ||
        String(s.rollNumber).includes(query) ||
        s.studentId.toLowerCase().includes(query);

      const matchesClass = classFilter === 'All' || s.className === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, classFilter]);

  // Selected Student Details & Balance calculation
  const currentStudentDetails = useMemo(() => {
    if (!activeStudent) return null;

    const dues = studentFeeDues.filter((d) => d.studentId === activeStudent.id);
    const totalDue = dues.reduce((sum, d) => sum + (d.total || 0), 0);
    const totalPaid = dues.reduce((sum, d) => sum + (d.paid || 0), 0);
    const balance = Math.max(0, totalDue - totalPaid);

    const studentTx = transactions.filter((t) => t.studentId === activeStudent.id);

    return {
      dues,
      totalDue,
      totalPaid,
      balance,
      transactions: studentTx,
    };
  }, [activeStudent, studentFeeDues, transactions]);

  const handleSelectStudent = (st) => {
    setActiveStudent(st);
    setSearchTerm('');
  };

  const handleClearStudent = () => {
    setActiveStudent(null);
    if (onClearExternalStudent) onClearExternalStudent();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Search & Filter Bar Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Search Student</h2>
            <p className="text-xs text-slate-500">
              Search by student name, roll number, or student ID to collect fees
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, roll no., student ID... (min 2 chars)"
              className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 transition-all"
            />

            {/* Live Search Auto-Suggest Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto custom-scrollbar">
                {searchResults.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStudent(st)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-orange-50/60 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF6B2C] font-bold text-xs flex items-center justify-center">
                        {st.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Class {st.className} • Roll: {st.rollNumber}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-semibold">
                      {st.studentId}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
            >
              <option value="All">All Classes</option>
              <option value="1-A">1-A</option>
              <option value="1-B">1-B</option>
              <option value="2-A">2-A</option>
              <option value="2-B">2-B</option>
              <option value="10-A">10-A</option>
              <option value="10-B">10-B</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Student Dashboard View */}
      {activeStudent && currentStudentDetails ? (
        <div className="space-y-8 animate-fade-in">
          {/* Active Student Summary Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 relative">
            <button
              type="button"
              onClick={handleClearStudent}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Change Student"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#FFF5F0] text-[#FF6B2C] font-extrabold text-xl flex items-center justify-center border border-[#FF6B2C]/20 shadow-inner">
                {activeStudent.initials}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{activeStudent.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Class {activeStudent.className} · ID:{' '}
                  <span className="font-mono font-bold text-slate-700">{activeStudent.studentId}</span> · Roll:{' '}
                  <span className="font-bold text-slate-700">{activeStudent.rollNumber}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 self-start md:self-auto pr-8">
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">Total Paid</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  {formatCurrency(currentStudentDetails.totalPaid)}
                </span>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">Balance</span>
                <span className="text-xl font-extrabold text-rose-600">
                  {formatCurrency(currentStudentDetails.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Pending / Partial Dues Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Pending / Partial Dues
              </h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">TITLE</th>
                    <th className="py-3.5 px-6">TOTAL</th>
                    <th className="py-3.5 px-6">PAID</th>
                    <th className="py-3.5 px-6">BALANCE</th>
                    <th className="py-3.5 px-6">DUE DATE</th>
                    <th className="py-3.5 px-6">STATUS</th>
                    <th className="py-3.5 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentStudentDetails.dues.length > 0 ? (
                    currentStudentDetails.dues.map((due) => {
                      const balance = due.total - due.paid;
                      const status = calculateFeeStatus(due.paid, due.total, due.dueDate);
                      return (
                        <tr key={due.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                          <td className="py-4 px-6 font-bold text-slate-900">{due.title}</td>
                          <td className="py-4 px-6 text-slate-700">{formatCurrency(due.total)}</td>
                          <td className="py-4 px-6 font-semibold text-emerald-600">
                            {formatCurrency(due.paid)}
                          </td>
                          <td className="py-4 px-6 font-bold text-rose-600">
                            {formatCurrency(balance)}
                          </td>
                          <td className="py-4 px-6 text-slate-600">{due.dueDate}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : status === 'Partial'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : status === 'Overdue'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-orange-50 text-orange-700 border border-orange-200'
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {balance > 0 ? (
                              <button
                                type="button"
                                onClick={() => onOpenCollectModal(due, activeStudent)}
                                className="px-4 py-1.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                              >
                                Collect
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No fee dues found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create New Invoice from Fee Structure Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Create New Invoice from Fee Structure
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign additional fee heads from master structure to this student
              </p>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">FEE HEAD</th>
                    <th className="py-3.5 px-6">GROSS</th>
                    <th className="py-3.5 px-6">CONCESSION</th>
                    <th className="py-3.5 px-6">NET AMOUNT</th>
                    <th className="py-3.5 px-6">FREQUENCY</th>
                    <th className="py-3.5 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeHeads.map((fh) => (
                    <tr key={fh.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                      <td className="py-4 px-6 font-bold text-slate-900">{fh.title}</td>
                      <td className="py-4 px-6 text-slate-700">{formatCurrency(fh.amount)}</td>
                      <td className="py-4 px-6 text-slate-400">—</td>
                      <td className="py-4 px-6 font-bold text-slate-900">{formatCurrency(fh.amount)}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-slate-700 border border-orange-100">
                          {fh.frequency}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => onAddInvoiceForStudent(activeStudent.id, fh)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Payment History</h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">RECEIPT NO</th>
                    <th className="py-3.5 px-6">TITLE</th>
                    <th className="py-3.5 px-6">AMOUNT</th>
                    <th className="py-3.5 px-6">MODE</th>
                    <th className="py-3.5 px-6">DATE</th>
                    <th className="py-3.5 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentStudentDetails.transactions.length > 0 ? (
                    currentStudentDetails.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                        <td className="py-4 px-6 font-mono text-slate-700 font-bold">{tx.receiptNo}</td>
                        <td className="py-4 px-6 font-semibold text-slate-900">{tx.feeHead}</td>
                        <td className="py-4 px-6 font-extrabold text-emerald-600">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-4 px-6 text-slate-600">{tx.paymentMode}</td>
                        <td className="py-4 px-6 text-slate-600">{tx.date}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenReceiptModal(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-500" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No previous payment receipts recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-xs">
          Select or search for a student above to view pending dues and collect fees.
        </div>
      )}
    </div>
  );
};
