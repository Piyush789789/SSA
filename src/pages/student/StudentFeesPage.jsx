import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Building,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/data/feeData';

export const StudentFeesPage = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();

  const studentName = currentUser?.name || 'Rohit Verma';
  const studentId = currentUser?.studentId || 'STU-2026-0503';
  const className = currentUser?.className || '5-B';
  const section = currentUser?.section || 'B';
  const rollNumber = currentUser?.rollNumber || 3;

  // Initial filter from URL query e.g. ?filter=pending
  const urlFilter = searchParams.get('filter');
  const [statusFilter, setStatusFilter] = useState(
    urlFilter?.toLowerCase() === 'pending' ? 'Pending' : 'ALL'
  );
  const [feeTypeFilter, setFeeTypeFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL'); // 'ALL' | 'LAST_30' | 'THIS_TERM'
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Student Fee Transactions Data (Centralized for Authenticated Student)
  const initialTransactions = useMemo(() => [
    {
      id: 'TXN-1025',
      receiptNo: 'REC-1025',
      transactionId: 'TXN98421055',
      date: '2026-09-25',
      dateTime: '25 Sep 2026, 11:30 AM',
      feeType: 'Tuition Fee',
      description: 'September Tuition Fee (Class 5-B)',
      amount: 2000,
      discount: 0,
      finalAmount: 2000,
      amountPaid: 2000,
      pendingAmount: 0,
      paymentMethod: 'UPI',
      status: 'Paid',
      collectedBy: 'Accounts Dept / S. K. Verma',
      notes: 'Digital payment via UPI (GPay ref: 9482710182)',
    },
    {
      id: 'TXN-1008',
      receiptNo: 'REC-1008',
      transactionId: 'TXN98310029',
      date: '2026-09-10',
      dateTime: '10 Sep 2026, 09:45 AM',
      feeType: 'Transport Fee',
      description: 'September Transport Bus Route #4',
      amount: 800,
      discount: 0,
      finalAmount: 800,
      amountPaid: 800,
      pendingAmount: 0,
      paymentMethod: 'Cash',
      status: 'Paid',
      collectedBy: 'Fee Counter 1 / Reena Devi',
      notes: 'Paid in cash at main accounts counter.',
    },
    {
      id: 'TXN-0945',
      receiptNo: 'REC-0945',
      transactionId: 'TXN97204910',
      date: '2026-08-15',
      dateTime: '15 Aug 2026, 02:15 PM',
      feeType: 'Tuition Fee',
      description: 'August Tuition Fee (Class 5-B)',
      amount: 2000,
      discount: 0,
      finalAmount: 2000,
      amountPaid: 2000,
      pendingAmount: 0,
      paymentMethod: 'Net Banking',
      status: 'Paid',
      collectedBy: 'Online Gateway / HDFC Portal',
      notes: 'Processed via school net banking payment gateway.',
    },
    {
      id: 'TXN-0812',
      receiptNo: 'REC-0812',
      transactionId: 'TXN95018241',
      date: '2026-07-10',
      dateTime: '10 Jul 2026, 10:20 AM',
      feeType: 'Admission & Development',
      description: 'Annual Development & Library Charges',
      amount: 2900,
      discount: 0,
      finalAmount: 2900,
      amountPaid: 2900,
      pendingAmount: 0,
      paymentMethod: 'Cheque',
      status: 'Paid',
      collectedBy: 'Chief Accountant Office',
      notes: 'SBI Cheque No. 55120 cleared successfully on 12 Jul 2026.',
    },
    {
      id: 'TXN-1060',
      receiptNo: 'REC-1060',
      transactionId: 'TXN-PENDING-01',
      date: '2026-10-05',
      dateTime: 'Due on 10 Oct 2026',
      feeType: 'Tuition Fee',
      description: 'October Tuition Fee (Class 5-B)',
      amount: 2000,
      discount: 0,
      finalAmount: 2000,
      amountPaid: 0,
      pendingAmount: 2000,
      paymentMethod: '—',
      status: 'Pending',
      collectedBy: 'Pending Payment',
      notes: 'Please pay on or before 10th October 2026 to avoid late fee.',
    },
    {
      id: 'TXN-1072',
      receiptNo: 'REC-1072',
      transactionId: 'TXN-PENDING-02',
      date: '2026-10-10',
      dateTime: 'Due on 15 Oct 2026',
      feeType: 'Examination Fee',
      description: 'Term 1 Mid-Term & Half Yearly Exam Charges',
      amount: 1000,
      discount: 0,
      finalAmount: 1000,
      amountPaid: 0,
      pendingAmount: 1000,
      paymentMethod: '—',
      status: 'Pending',
      collectedBy: 'Pending Payment',
      notes: 'Examination registration and paper evaluation fee.',
    },
  ], []);

  // Calculate dynamic totals
  const totalFees = useMemo(() => {
    return initialTransactions.reduce((sum, item) => sum + (item.finalAmount || item.amount), 0);
  }, [initialTransactions]);

  const totalPaid = useMemo(() => {
    return initialTransactions.reduce((sum, item) => sum + (item.amountPaid || 0), 0);
  }, [initialTransactions]);

  const pendingAmount = useMemo(() => {
    return Math.max(0, totalFees - totalPaid);
  }, [totalFees, totalPaid]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((txn) => {
      if (statusFilter !== 'ALL' && txn.status !== statusFilter) return false;
      if (feeTypeFilter !== 'ALL' && txn.feeType !== feeTypeFilter) return false;
      if (paymentMethodFilter !== 'ALL' && txn.paymentMethod !== paymentMethodFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const rMatch = txn.receiptNo.toLowerCase().includes(q);
        const tMatch = txn.transactionId.toLowerCase().includes(q);
        const fMatch = txn.feeType.toLowerCase().includes(q);
        const dMatch = txn.description.toLowerCase().includes(q);
        if (!rMatch && !tMatch && !fMatch && !dMatch) return false;
      }
      return true;
    });
  }, [initialTransactions, statusFilter, feeTypeFilter, paymentMethodFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            PAID
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            PARTIALLY PAID
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            PENDING
          </span>
        );
    }
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
            <CreditCard className="w-7 h-7 text-[#FF6B2C]" />
            Fee Details
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Complete transaction ledger, official receipts, and pending dues for {studentName} (Class {className}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-2xl transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Fees */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fees</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(totalFees)}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Total assigned charges for 2026-27</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Paid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid Amount</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(totalPaid)}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {Math.round((totalPaid / totalFees) * 100)}% of total fee cleared
            </p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Fee Pending</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
              {formatCurrency(pendingAmount)}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Next due date: 10 Oct 2026</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt no, transaction ID, or fee type..."
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all"
            />
          </div>

          {/* Fee Type Dropdown */}
          <select
            value={feeTypeFilter}
            onChange={(e) => setFeeTypeFilter(e.target.value)}
            className="w-full sm:w-auto h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 px-4 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Fee Types</option>
            <option value="Tuition Fee">Tuition Fee</option>
            <option value="Transport Fee">Transport Fee</option>
            <option value="Admission & Development">Admission & Development</option>
            <option value="Examination Fee">Examination Fee</option>
          </select>

          {/* Payment Method Dropdown */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="w-full sm:w-auto h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 px-4 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-2">Status:</span>
          {['ALL', 'Paid', 'Partially Paid', 'Pending'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#FF6B2C] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Transactions' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Transaction History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Fee Transaction History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredTransactions.length} transaction records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Date</th>
                <th className="py-3.5 px-4">Receipt No.</th>
                <th className="py-3.5 px-4">Fee Type</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No transactions match your search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTransaction(txn)}
                  >
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">
                      {txn.date}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-[#FF6B2C]">
                      {txn.receiptNo}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {txn.feeType}
                    </td>
                    <td className="py-4 px-4 text-slate-500 max-w-[220px] truncate">
                      {txn.description}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(txn.finalAmount || txn.amount)}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-600">
                      {txn.paymentMethod}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(txn.status)}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTransaction(txn)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Details
                        </button>
                        {txn.status === 'Paid' && (
                          <button
                            onClick={() => setReceiptToPrint(txn)}
                            className="px-3 py-1.5 rounded-xl bg-[#FFF5F0] hover:bg-orange-100 text-[#FF6B2C] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-orange-200/60"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Transaction Details
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#FF6B2C]">
                    {selectedTransaction.receiptNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Meta */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-800">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student ID / Roll:</span>
                <span className="font-bold text-slate-800">{studentId} (Roll #{rollNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class & Section:</span>
                <span className="font-bold text-slate-800">{className}</span>
              </div>
            </div>

            {/* Fee Breakdown Table */}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Fee Head / Type:</span>
                <span className="font-bold text-slate-800">{selectedTransaction.feeType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Description:</span>
                <span className="font-medium text-slate-800">{selectedTransaction.description}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-slate-800">{formatCurrency(selectedTransaction.amount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Concession / Discount:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedTransaction.discount || 0)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Final Charge:</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedTransaction.finalAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedTransaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Pending Dues:</span>
                <span className="font-bold text-rose-600">{formatCurrency(selectedTransaction.pendingAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Status:</span>
                <div>{getStatusBadge(selectedTransaction.status)}</div>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-800">{selectedTransaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Transaction Ref / ID:</span>
                <span className="font-mono text-xs font-semibold text-slate-700">{selectedTransaction.transactionId}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Received By:</span>
                <span className="font-semibold text-slate-800">{selectedTransaction.collectedBy}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              {selectedTransaction.status === 'Paid' && (
                <button
                  onClick={() => {
                    const t = selectedTransaction;
                    setSelectedTransaction(null);
                    setReceiptToPrint(t);
                  }}
                  className="px-5 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  View Official Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Fee Receipt Print Modal */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Receipt Preview</span>
              <button
                onClick={() => setReceiptToPrint(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="border-2 border-slate-900 p-6 rounded-2xl bg-white space-y-5">
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  SHIV SHANTI ADARSH ACADEMY
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Affiliated to CBSE, New Delhi • School Code: 2026-SSA
                </p>
                <div className="inline-block bg-slate-900 text-white font-bold text-xs px-4 py-1 rounded-full uppercase mt-2 tracking-wider">
                  OFFICIAL FEE RECEIPT
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500">Receipt No:</p>
                  <p className="font-mono font-bold text-slate-900 text-sm">{receiptToPrint.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Date & Time:</p>
                  <p className="font-bold text-slate-900">{receiptToPrint.dateTime}</p>
                </div>
                <div>
                  <p className="text-slate-500">Student Name:</p>
                  <p className="font-bold text-slate-900 text-sm">{studentName}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Admission ID / Roll:</p>
                  <p className="font-bold text-slate-900">{studentId} (Roll #{rollNumber})</p>
                </div>
                <div>
                  <p className="text-slate-500">Class & Section:</p>
                  <p className="font-bold text-slate-900">{className}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Payment Mode:</p>
                  <p className="font-bold text-emerald-700">{receiptToPrint.paymentMethod} (PAID)</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">S.No</th>
                      <th className="p-2.5">Particulars / Description</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-bold">1</td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{receiptToPrint.feeType}</div>
                        <div className="text-[11px] text-slate-500">{receiptToPrint.description}</div>
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(receiptToPrint.amountPaid)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-900 font-bold">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-right uppercase">Total Amount Received:</td>
                      <td className="p-2.5 text-right text-sm text-slate-900">
                        {formatCurrency(receiptToPrint.amountPaid)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer Signature */}
              <div className="pt-6 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p>Receiver: <strong>{receiptToPrint.collectedBy}</strong></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Computer generated receipt.</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-900 mb-1" />
                  <p className="font-bold text-slate-900">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReceiptToPrint(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  triggerToast('Printing receipt...');
                }}
                className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeesPage;
