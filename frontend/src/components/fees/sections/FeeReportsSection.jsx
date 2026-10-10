import React, { useState, useMemo } from 'react';
import { Download, Calendar, Filter, Search, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency, calculateFeeStatus } from '@/data/feeData';

export const FeeReportsSection = ({
  students,
  studentFeeDues,
  transactions,
  onSelectStudentForCollection,
}) => {
  const [activeTab, setActiveTab] = useState('Day Book');

  // Day Book State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Class Report State
  const [classFilter, setClassFilter] = useState('All');

  // Ledger Search State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [selectedLedgerStudent, setSelectedLedgerStudent] = useState(null);

  // Filter transactions for Day Book
  const dayBookTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDate);
  }, [transactions, selectedDate]);

  const dayBookTotal = useMemo(() => {
    return dayBookTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [dayBookTransactions]);

  // CSV Export for Day Book
  const handleExportCSV = () => {
    if (dayBookTransactions.length === 0) return;

    const headers = ['Receipt No', 'Student', 'Class', 'Fee Head', 'Amount', 'Payment Mode', 'Date', 'Status'];
    const rows = dayBookTransactions.map((t) => [
      t.receiptNo,
      t.studentName,
      t.className,
      `"${t.feeHead}"`,
      t.amount,
      t.paymentMode,
      t.date,
      t.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DayBook_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Defaulters List
  const defaultersList = useMemo(() => {
    return students
      .map((student) => {
        const dues = studentFeeDues.filter((d) => d.studentId === student.id);
        const totalDue = dues.reduce((sum, d) => sum + (d.total || 0), 0);
        const paid = dues.reduce((sum, d) => sum + (d.paid || 0), 0);
        const pending = Math.max(0, totalDue - paid);

        let oldestDueDate = null;
        dues.forEach((d) => {
          if (d.paid < d.total) {
            if (!oldestDueDate || new Date(d.dueDate) < new Date(oldestDueDate)) {
              oldestDueDate = d.dueDate;
            }
          }
        });

        const status = calculateFeeStatus(paid, totalDue, oldestDueDate);
        return {
          ...student,
          totalDue,
          paid,
          pending,
          status,
          oldestDueDate,
        };
      })
      .filter((s) => s.pending > 0);
  }, [students, studentFeeDues]);

  // Student Search for Ledger
  const ledgerSearchResults = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    if (q.length < 2) return [];

    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        String(s.rollNumber).includes(q)
    );
  }, [students, ledgerSearch]);

  const selectedLedgerDetails = useMemo(() => {
    if (!selectedLedgerStudent) return null;
    const dues = studentFeeDues.filter((d) => d.studentId === selectedLedgerStudent.id);
    const txs = transactions.filter((t) => t.studentId === selectedLedgerStudent.id);
    const totalDue = dues.reduce((sum, d) => sum + (d.total || 0), 0);
    const paid = dues.reduce((sum, d) => sum + (d.paid || 0), 0);
    const balance = Math.max(0, totalDue - paid);

    return {
      dues,
      txs,
      totalDue,
      paid,
      balance,
    };
  }, [selectedLedgerStudent, studentFeeDues, transactions]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Secondary Reports Navigation Pills */}
      <div className="bg-[#FFF5F0]/60 p-1.5 rounded-2xl inline-flex flex-wrap gap-1 border border-orange-100">
        {['Day Book', 'Class Report', 'Defaulters', 'Student Ledger'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white text-[#FF6B2C] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* TAB 1: DAY BOOK                            */}
      {/* ========================================== */}
      {activeTab === 'Day Book' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-extrabold text-slate-900">Day Book</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={dayBookTransactions.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                dayBookTransactions.length > 0
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">RECEIPT NO</th>
                  <th className="py-3.5 px-6">STUDENT</th>
                  <th className="py-3.5 px-6">CLASS</th>
                  <th className="py-3.5 px-6">TITLE</th>
                  <th className="py-3.5 px-6">AMOUNT</th>
                  <th className="py-3.5 px-6">MODE</th>
                  <th className="py-3.5 px-6">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayBookTransactions.length > 0 ? (
                  dayBookTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                      <td className="py-4 px-6 font-mono font-bold text-slate-700">{tx.receiptNo}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">{tx.studentName}</td>
                      <td className="py-4 px-6 text-slate-600">{tx.className}</td>
                      <td className="py-4 px-6 text-slate-800">{tx.feeHead}</td>
                      <td className="py-4 px-6 font-extrabold text-emerald-600">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">{tx.paymentMode}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No transactions recorded on {selectedDate}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end items-center gap-6 text-xs font-bold text-slate-600">
            <span>Transactions: {dayBookTransactions.length}</span>
            <span>
              Total Collected:{' '}
              <strong className="text-emerald-600 font-extrabold text-sm ml-1">
                {formatCurrency(dayBookTotal)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: CLASS REPORT                        */}
      {/* ========================================== */}
      {activeTab === 'Class Report' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-extrabold text-slate-900">Class Fee Summary Report</h3>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
            >
              <option value="All">All Classes</option>
              <option value="1-A">1-A</option>
              <option value="1-B">1-B</option>
              <option value="2-A">2-A</option>
              <option value="10-B">10-B</option>
            </select>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">CLASS</th>
                  <th className="py-3.5 px-6">STUDENTS</th>
                  <th className="py-3.5 px-6">TOTAL DUE</th>
                  <th className="py-3.5 px-6">TOTAL COLLECTED</th>
                  <th className="py-3.5 px-6">TOTAL PENDING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {['1-A', '1-B', '10-B'].map((clsName) => {
                  const classStudents = students.filter((s) => s.className === clsName);
                  const stIds = classStudents.map((s) => s.id);
                  const dues = studentFeeDues.filter((d) => stIds.includes(d.studentId));

                  const totalDue = dues.reduce((sum, d) => sum + d.total, 0);
                  const totalCollected = dues.reduce((sum, d) => sum + d.paid, 0);
                  const totalPending = Math.max(0, totalDue - totalCollected);

                  return (
                    <tr key={clsName} className="hover:bg-slate-50/70">
                      <td className="py-4 px-6 font-extrabold text-slate-900">{clsName}</td>
                      <td className="py-4 px-6 text-slate-700">{classStudents.length}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">{formatCurrency(totalDue)}</td>
                      <td className="py-4 px-6 font-bold text-emerald-600">{formatCurrency(totalCollected)}</td>
                      <td className="py-4 px-6 font-bold text-rose-600">{formatCurrency(totalPending)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: DEFAULTERS                          */}
      {/* ========================================== */}
      {activeTab === 'Defaulters' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Fee Defaulters List</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students with outstanding pending or overdue balances
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-600 font-bold text-xs rounded-full border border-rose-200">
              {defaultersList.length} Defaulters
            </span>
          </div>

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
                  <th className="py-3.5 px-6">OLDEST DUE DATE</th>
                  <th className="py-3.5 px-6">STATUS</th>
                  <th className="py-3.5 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {defaultersList.length > 0 ? (
                  defaultersList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="py-4 px-6 font-bold text-slate-900">{st.name}</td>
                      <td className="py-4 px-6 text-slate-700">{st.className}</td>
                      <td className="py-4 px-6 font-mono text-slate-600">{st.studentId}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">{formatCurrency(st.totalDue)}</td>
                      <td className="py-4 px-6 font-bold text-emerald-600">{formatCurrency(st.paid)}</td>
                      <td className="py-4 px-6 font-extrabold text-rose-600">{formatCurrency(st.pending)}</td>
                      <td className="py-4 px-6 text-slate-600">{st.oldestDueDate || '—'}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            st.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectStudentForCollection(st)}
                          className="px-4 py-1.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Collect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No fee defaulters found!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: STUDENT LEDGER                      */}
      {/* ========================================== */}
      {activeTab === 'Student Ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <h3 className="text-lg font-extrabold text-slate-900">Student Ledger</h3>

          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              placeholder="Search student for ledger..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B2C]"
            />

            {/* Dropdown Suggestion */}
            {ledgerSearchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl py-2">
                {ledgerSearchResults.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedLedgerStudent(st);
                      setLedgerSearch('');
                    }}
                    className="w-full px-4 py-2 hover:bg-orange-50 text-left text-xs font-bold text-slate-800 flex justify-between cursor-pointer"
                  >
                    <span>{st.name} (Class {st.className})</span>
                    <span className="font-mono text-slate-500">{st.studentId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ledger View */}
          {selectedLedgerStudent && selectedLedgerDetails ? (
            <div className="space-y-6 border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {selectedLedgerStudent.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Class {selectedLedgerStudent.className} • ID: {selectedLedgerStudent.studentId}
                  </p>
                </div>
                <div className="flex gap-6 text-xs text-right">
                  <div>
                    <span className="text-slate-400">Total Billed:</span>{' '}
                    <strong className="text-slate-900 font-bold block">
                      {formatCurrency(selectedLedgerDetails.totalDue)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Paid:</span>{' '}
                    <strong className="text-emerald-600 font-bold block">
                      {formatCurrency(selectedLedgerDetails.paid)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Balance:</span>{' '}
                    <strong className="text-rose-600 font-bold block">
                      {formatCurrency(selectedLedgerDetails.balance)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Transactions Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Transaction & Ledger History
                </h4>
                <div className="space-y-2">
                  {selectedLedgerDetails.txs.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{tx.feeHead}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{tx.receiptNo} • {tx.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 text-sm block">
                          +{formatCurrency(tx.amount)}
                        </span>
                        <span className="text-slate-500">{tx.paymentMode}</span>
                      </div>
                    </div>
                  ))}
                  {selectedLedgerDetails.txs.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No payments recorded for this student.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Search and select a student above to view complete financial ledger history.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
