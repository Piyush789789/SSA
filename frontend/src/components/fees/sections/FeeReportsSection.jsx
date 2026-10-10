import React, { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { AsyncState } from '@/components/common/AsyncState';
import { formatCurrency, formatDate, formatDateTime, todayIso } from '@/utils';
import { groupDuesByStudent, netAmount, paymentDate, statusBadgeClass } from '@/components/fees/feeHelpers';
import { ExportButton } from '@/components/common/ExportButton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

/** Reports derived from real payments (GET /fees/payments) and dues (GET /fees/dues). */
export const FeeReportsSection = ({ classes = [], onSelectStudentForCollection }) => {
  const [activeTab, setActiveTab] = useState('Day Book');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [classFilter, setClassFilter] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [selectedLedgerStudentId, setSelectedLedgerStudentId] = useState(null);

  const paymentsApi = useApi('/fees/payments');
  const duesApi = useApi('/fees/dues');
  const payments = useMemo(() => paymentsApi.data || [], [paymentsApi.data]);
  const dues = useMemo(() => duesApi.data || [], [duesApi.data]);

  const dayBookTransactions = useMemo(
    () => payments.filter((p) => paymentDate(p) === selectedDate),
    [payments, selectedDate],
  );
  const dayBookTotal = dayBookTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthly = useMemo(() => {
    const byMonth = new Map();
    payments.forEach((p) => {
      const ym = paymentDate(p).slice(0, 7);
      if (!ym) return;
      const entry = byMonth.get(ym) || { month: ym, count: 0, total: 0, modes: {} };
      entry.count += 1;
      entry.total += p.amount || 0;
      entry.modes[p.paymentMode] = (entry.modes[p.paymentMode] || 0) + (p.amount || 0);
      byMonth.set(ym, entry);
    });
    return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
  }, [payments]);
  const monthlyMax = Math.max(1, ...monthly.map((m) => m.total));

  const classRows = useMemo(() => {
    const list = classFilter ? [classFilter] : classes;
    return list.map((cls) => {
      const classDues = dues.filter((d) => d.className === cls);
      return {
        className: cls,
        students: new Set(classDues.map((d) => d.studentId)).size,
        totalDue: classDues.reduce((s, d) => s + netAmount(d), 0),
        collected: classDues.reduce((s, d) => s + (d.paid || 0), 0),
        pending: classDues.reduce((s, d) => s + (d.pending || 0), 0),
        overdue: classDues.filter((d) => d.status === 'Overdue').reduce((s, d) => s + (d.pending || 0), 0),
      };
    });
  }, [dues, classes, classFilter]);

  const studentSummaries = useMemo(() => groupDuesByStudent(dues), [dues]);
  const defaultersList = useMemo(() => studentSummaries.filter((s) => s.pending > 0), [studentSummaries]);

  const ledgerSearchResults = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return studentSummaries.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)).slice(0, 20);
  }, [studentSummaries, ledgerSearch]);

  const ledgerStudent = studentSummaries.find((s) => s.id === selectedLedgerStudentId) || null;
  const ledgerDues = ledgerStudent ? dues.filter((d) => d.studentId === ledgerStudent.id) : [];
  const ledgerPayments = ledgerStudent ? payments.filter((p) => p.studentId === ledgerStudent.id) : [];

  const handleExportCSV = () => {
    if (dayBookTransactions.length === 0) return;
    const headers = ['Receipt No', 'Student ID', 'Student', 'Class', 'Fee Head', 'Amount', 'Payment Mode', 'Paid At', 'Collected By', 'Remarks'];
    const rows = dayBookTransactions.map((t) => [
      t.receiptNo, t.studentId, t.studentName, t.className, t.feeTitle, t.amount, t.paymentMode, t.paidAt, t.collectedBy, t.remarks,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `DayBook_Report_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#FFF5F0]/60 p-1.5 rounded-2xl inline-flex flex-wrap gap-1 border border-orange-100">
        {['Day Book', 'Monthly', 'Class Report', 'Defaulters', 'Student Ledger'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                isActive ? 'bg-white text-[#FF6B2C] shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {tab === 'Monthly' ? 'Monthly Collections' : tab}
            </button>
          );
        })}
      </div>

      <AsyncState state={[paymentsApi, duesApi]} loadingText="Loading fee records…">
        {() => (
          <>
            {/* DAY BOOK */}
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
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">RECEIPT NO</th>
                        <th className="py-3.5 px-6">STUDENT</th>
                        <th className="py-3.5 px-6">CLASS</th>
                        <th className="py-3.5 px-6">TITLE</th>
                        <th className="py-3.5 px-6">AMOUNT</th>
                        <th className="py-3.5 px-6">MODE</th>
                        <th className="py-3.5 px-6">TIME</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dayBookTransactions.length > 0 ? (
                        dayBookTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                            <td className="py-4 px-6 font-mono font-bold text-slate-700">{tx.receiptNo}</td>
                            <td className="py-4 px-6 font-bold text-slate-900">{tx.studentName}</td>
                            <td className="py-4 px-6 text-slate-600">{tx.className}</td>
                            <td className="py-4 px-6 text-slate-800">{tx.feeTitle}</td>
                            <td className="py-4 px-6 font-extrabold text-emerald-600">{formatCurrency(tx.amount)}</td>
                            <td className="py-4 px-6 font-semibold text-slate-700">{tx.paymentMode}</td>
                            <td className="py-4 px-6 text-slate-600">{formatDateTime(tx.paidAt)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                            No payments recorded on {formatDate(selectedDate)}.
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
                    <strong className="text-emerald-600 font-extrabold text-sm ml-1">{formatCurrency(dayBookTotal)}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* MONTHLY COLLECTIONS */}
            {activeTab === 'Monthly' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Monthly Collections</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Totals of all recorded payments, grouped by month</p>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">MONTH</th>
                        <th className="py-3.5 px-6">PAYMENTS</th>
                        <th className="py-3.5 px-6">COLLECTED</th>
                        <th className="py-3.5 px-6">BY MODE</th>
                        <th className="py-3.5 px-6 w-1/4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {monthly.length > 0 ? (
                        monthly.map((m) => (
                          <tr key={m.month} className="hover:bg-slate-50/70">
                            <td className="py-4 px-6 font-extrabold text-slate-900">{monthLabel(m.month)}</td>
                            <td className="py-4 px-6 text-slate-700">{m.count}</td>
                            <td className="py-4 px-6 font-bold text-emerald-600">{formatCurrency(m.total)}</td>
                            <td className="py-4 px-6 text-slate-500">
                              {Object.entries(m.modes)
                                .map(([mode, amt]) => `${mode} ${formatCurrency(amt)}`)
                                .join(' · ')}
                            </td>
                            <td className="py-4 px-6">
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-[#FF6B2C] h-2 rounded-full" style={{ width: `${(m.total / monthlyMax) * 100}%` }} />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                            No payments recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CLASS REPORT */}
            {activeTab === 'Class Report' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-extrabold text-slate-900">Class Fee Summary Report</h3>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
                  >
                    <option value="">All Classes</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">CLASS</th>
                        <th className="py-3.5 px-6">STUDENTS BILLED</th>
                        <th className="py-3.5 px-6">TOTAL DUE</th>
                        <th className="py-3.5 px-6">TOTAL COLLECTED</th>
                        <th className="py-3.5 px-6">TOTAL PENDING</th>
                        <th className="py-3.5 px-6">OVERDUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {classRows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">No classes found.</td>
                        </tr>
                      )}
                      {classRows.map((row) => (
                        <tr key={row.className} className="hover:bg-slate-50/70">
                          <td className="py-4 px-6 font-extrabold text-slate-900">{row.className}</td>
                          <td className="py-4 px-6 text-slate-700">{row.students}</td>
                          <td className="py-4 px-6 font-bold text-slate-900">{formatCurrency(row.totalDue)}</td>
                          <td className="py-4 px-6 font-bold text-emerald-600">{formatCurrency(row.collected)}</td>
                          <td className="py-4 px-6 font-bold text-rose-600">{formatCurrency(row.pending)}</td>
                          <td className="py-4 px-6 font-bold text-rose-700">{formatCurrency(row.overdue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DEFAULTERS */}
            {activeTab === 'Defaulters' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Fee Defaulters List</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Students with outstanding pending or overdue balances</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 font-bold text-xs rounded-full border border-rose-200">
                      {defaultersList.length} Defaulters
                    </span>
                    <ExportButton
                      rows={defaultersList}
                      fileBase="fee-defaulters"
                      columns={[
                        { label: 'Student ID', value: (s) => s.id },
                        { label: 'Name', value: (s) => s.name },
                        { label: 'Class', value: (s) => s.className },
                        { label: 'Total Due', value: (s) => s.totalDue },
                        { label: 'Concession', value: (s) => s.concession },
                        { label: 'Paid', value: (s) => s.paid },
                        { label: 'Pending', value: (s) => s.pending },
                        { label: 'Oldest Due Date', value: (s) => s.oldestDueDate },
                        { label: 'Overdue', value: (s) => (s.anyOverdue ? 'Yes' : 'No') },
                      ]}
                    />
                  </div>
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
                            <td className="py-4 px-6 font-mono text-slate-600">{st.id}</td>
                            <td className="py-4 px-6 font-bold text-slate-900">{formatCurrency(st.totalDue)}</td>
                            <td className="py-4 px-6 font-bold text-emerald-600">{formatCurrency(st.paid)}</td>
                            <td className="py-4 px-6 font-extrabold text-rose-600">{formatCurrency(st.pending)}</td>
                            <td className="py-4 px-6 text-slate-600">{formatDate(st.oldestDueDate)}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusBadgeClass(st.status)}`}>
                                {st.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                type="button"
                                onClick={() => onSelectStudentForCollection({ id: st.id, name: st.name, className: st.className })}
                                className="px-4 py-1.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                Collect
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">No fee defaulters found!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STUDENT LEDGER */}
            {activeTab === 'Student Ledger' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                <h3 className="text-lg font-extrabold text-slate-900">Student Ledger</h3>

                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Search student by name or ID..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B2C]"
                  />

                  {ledgerSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto">
                      {ledgerSearchResults.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedLedgerStudentId(st.id);
                            setLedgerSearch('');
                          }}
                          className="w-full px-4 py-2 hover:bg-orange-50 text-left text-xs font-bold text-slate-800 flex justify-between cursor-pointer"
                        >
                          <span>{st.name} (Class {st.className})</span>
                          <span className="font-mono text-slate-500">{st.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {ledgerStudent ? (
                  <div className="space-y-6 border-t border-slate-100 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{ledgerStudent.name}</h4>
                        <p className="text-xs text-slate-500">
                          Class {ledgerStudent.className} • ID: {ledgerStudent.id}
                        </p>
                      </div>
                      <div className="flex gap-6 text-xs text-right">
                        <div>
                          <span className="text-slate-400">Total Billed:</span>{' '}
                          <strong className="text-slate-900 font-bold block">{formatCurrency(ledgerStudent.totalDue)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Paid:</span>{' '}
                          <strong className="text-emerald-600 font-bold block">{formatCurrency(ledgerStudent.paid)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Balance:</span>{' '}
                          <strong className="text-rose-600 font-bold block">{formatCurrency(ledgerStudent.pending)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bills</h4>
                      <div className="space-y-2">
                        {ledgerDues.map((d) => (
                          <div key={d.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-900 block">{d.title}</span>
                              <span className="text-slate-400 text-[11px]">
                                Due {formatDate(d.dueDate)}
                                {d.concession ? ` • Concession ${formatCurrency(d.concession)}` : ''}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-slate-900 text-sm block">{formatCurrency(netAmount(d))}</span>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClass(d.status)}`}>
                                {d.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payments</h4>
                      <div className="space-y-2">
                        {ledgerPayments.map((tx) => (
                          <div key={tx.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-900 block">{tx.feeTitle}</span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                {tx.receiptNo} • {formatDateTime(tx.paidAt)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-emerald-600 text-sm block">+{formatCurrency(tx.amount)}</span>
                              <span className="text-slate-500">{tx.paymentMode}</span>
                            </div>
                          </div>
                        ))}
                        {ledgerPayments.length === 0 && (
                          <p className="text-xs text-slate-400 italic">No payments recorded for this student.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Search and select a student above to view their bills and payment history.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </AsyncState>
    </div>
  );
};
