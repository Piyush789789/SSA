import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  Search,
  Eye,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/data/feeData';

export const ParentFeesPage = () => {
  const { currentUser, selectedChild, switchChild } = useAuth();
  const [searchParams] = useSearchParams();

  const linkedChildren = currentUser?.linkedChildren || [];
  const currentChild = selectedChild || linkedChildren[0] || {
    name: 'Yash Verma',
    className: '8-A',
    rollNumber: 24,
    studentId: 'STU-2026-0824',
  };

  const urlFilter = searchParams.get('filter');
  const [statusFilter, setStatusFilter] = useState(
    urlFilter?.toLowerCase() === 'pending' ? 'Pending' : 'ALL'
  );
  const [feeTypeFilter, setFeeTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [receiptToPrint, setReceiptToPrint] = useState(null);

  // Transactions per child
  const transactions = useMemo(() => {
    if (currentChild.className === '8-A') {
      return [
        {
          id: 'TXN-1021',
          receiptNo: 'REC-1021',
          transactionId: 'TXN88421099',
          date: '21 Apr 2026',
          time: '10:30 AM',
          feeType: 'Tuition Fee',
          description: 'Quarter 1 Tuition (Class 8-A)',
          amount: 4500,
          paid: 4500,
          pending: 0,
          paymentMethod: 'UPI',
          status: 'PAID',
          collectedBy: 'Accounts Office / S. K. Verma',
          notes: 'Paid via GPay (Ref: 884210991)',
        },
        {
          id: 'TXN-1054',
          receiptNo: 'REC-1054',
          transactionId: 'TXN89124018',
          date: '22 Jul 2026',
          time: '11:45 AM',
          feeType: 'Tuition Fee',
          description: 'Quarter 2 Tuition (Class 8-A)',
          amount: 4500,
          paid: 2500,
          pending: 2000,
          paymentMethod: 'Cash',
          status: 'PARTIAL',
          collectedBy: 'Fee Window 2 / Reena Devi',
          notes: 'Partial payment of Rs. 2,500 deposited. Remaining Rs. 2,000 due.',
        },
        {
          id: 'TXN-0980',
          receiptNo: 'REC-0980',
          transactionId: 'TXN87019230',
          date: '30 Mar 2026',
          time: '09:15 AM',
          feeType: 'Admission & Development',
          description: 'Annual Admission & Development Fee',
          amount: 3200,
          paid: 3200,
          pending: 0,
          paymentMethod: 'Cheque',
          status: 'PAID',
          collectedBy: 'Chief Accountant',
          notes: 'SBI Cheque No. 441092 cleared on 02 Apr 2026.',
        },
        {
          id: 'TXN-1088',
          receiptNo: '—',
          transactionId: 'TXN-PENDING',
          date: '31 Aug 2026',
          time: 'Due Date',
          feeType: 'Examination Fee',
          description: 'Half Yearly Examination Charges',
          amount: 800,
          paid: 0,
          pending: 800,
          paymentMethod: '—',
          status: 'PENDING',
          collectedBy: 'Pending Payment',
          notes: 'Exam fee mandatory before hall ticket release.',
        },
      ];
    }
    // Ananya (5-B)
    return [
      {
        id: 'TXN-2011',
        receiptNo: 'REC-2011',
        transactionId: 'TXN91024881',
        date: '21 Apr 2026',
        time: '10:45 AM',
        feeType: 'Tuition Fee',
        description: 'Quarter 1 Tuition (Class 5-B)',
        amount: 3900,
        paid: 3900,
        pending: 0,
        paymentMethod: 'UPI',
        status: 'PAID',
        collectedBy: 'Online Portal',
        notes: 'Cleared via UPI.',
      },
      {
        id: 'TXN-2045',
        receiptNo: 'REC-2045',
        transactionId: 'TXN92819402',
        date: '22 Jul 2026',
        time: '02:30 PM',
        feeType: 'Tuition Fee',
        description: 'Quarter 2 Tuition (Class 5-B)',
        amount: 3900,
        paid: 3900,
        pending: 0,
        paymentMethod: 'Net Banking',
        status: 'PAID',
        collectedBy: 'HDFC Net Banking',
        notes: 'Cleared online.',
      },
      {
        id: 'TXN-2090',
        receiptNo: '—',
        transactionId: 'TXN-PENDING-2',
        date: '10 Sep 2026',
        time: 'Due Date',
        feeType: 'Annual Library Fee',
        description: 'Annual Library & Activity Fee',
        amount: 2000,
        paid: 0,
        pending: 2000,
        paymentMethod: '—',
        status: 'PENDING',
        collectedBy: 'Pending Payment',
        notes: 'Please clear before term end.',
      },
    ];
  }, [currentChild.className]);

  // Calculations
  const totalFees = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalPaid = useMemo(() => transactions.reduce((sum, t) => sum + t.paid, 0), [transactions]);
  const totalPending = useMemo(() => Math.max(0, totalFees - totalPaid), [totalFees, totalPaid]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Paid' && txn.status !== 'PAID') return false;
        if (statusFilter === 'Partial' && txn.status !== 'PARTIAL') return false;
        if (statusFilter === 'Pending' && txn.status !== 'PENDING') return false;
      }
      if (feeTypeFilter !== 'ALL' && txn.feeType !== feeTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const rMatch = txn.receiptNo.toLowerCase().includes(q);
        const fMatch = txn.feeType.toLowerCase().includes(q);
        const dMatch = txn.description.toLowerCase().includes(q);
        if (!rMatch && !fMatch && !dMatch) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, feeTypeFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            PARTIAL
          </span>
        );
      case 'PENDING':
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
      {/* Header & Child Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-[#FF6B2C]" />
            Fee Ledger & Receipts
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Complete transaction ledger for {currentChild.name} (Class {currentChild.className}).
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
          <select
            value={currentChild.studentId}
            onChange={(e) => switchChild(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer pr-3"
          >
            {linkedChildren.map((child) => (
              <option key={child.studentId} value={child.studentId}>
                {child.name} ({child.className})
              </option>
            ))}
          </select>
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
            <p className="text-xs text-slate-500 font-medium mt-1">Annual assigned charges</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Paid</p>
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

        {/* Total Pending */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Pending</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
              {formatCurrency(totalPending)}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Outstanding dues</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt no, fee type, or description..."
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all"
            />
          </div>

          <select
            value={feeTypeFilter}
            onChange={(e) => setFeeTypeFilter(e.target.value)}
            className="w-full sm:w-auto h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 px-4 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Fee Types</option>
            <option value="Tuition Fee">Tuition Fee</option>
            <option value="Admission & Development">Admission & Development</option>
            <option value="Examination Fee">Examination Fee</option>
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-2">Status:</span>
          {['ALL', 'Paid', 'Partial', 'Pending'].map((st) => (
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
              Showing {filteredTransactions.length} records for {currentChild.name}
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
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Pending</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredTransactions.map((txn) => (
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
                  <td className="py-4 px-4 text-slate-500 max-w-[200px] truncate">
                    {txn.description}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-600 whitespace-nowrap">
                    {formatCurrency(txn.paid)}
                  </td>
                  <td className="py-4 px-4 font-bold text-rose-600 whitespace-nowrap">
                    {formatCurrency(txn.pending)}
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
                      {txn.status === 'PAID' && (
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
              ))}
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
                    Fee Transaction Details
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

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{currentChild.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class & Roll:</span>
                <span className="font-bold text-slate-800">Class {currentChild.className} (Roll #{currentChild.rollNumber})</span>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Fee Particular:</span>
                <span className="font-bold text-slate-800">{selectedTransaction.feeType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Description:</span>
                <span className="font-medium text-slate-800">{selectedTransaction.description}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Total Charge:</span>
                <span className="font-bold text-slate-800">{formatCurrency(selectedTransaction.amount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedTransaction.paid)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Pending Amount:</span>
                <span className="font-bold text-rose-600">{formatCurrency(selectedTransaction.pending)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Status:</span>
                <div>{getStatusBadge(selectedTransaction.status)}</div>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{selectedTransaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-xs font-semibold text-slate-700">{selectedTransaction.transactionId}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Collected By:</span>
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
              {selectedTransaction.status === 'PAID' && (
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

      {/* Official Receipt Modal */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Receipt Preview</span>
              <button
                onClick={() => setReceiptToPrint(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-slate-900 p-6 rounded-2xl bg-white space-y-5">
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

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500">Receipt No:</p>
                  <p className="font-mono font-bold text-slate-900 text-sm">{receiptToPrint.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Date & Time:</p>
                  <p className="font-bold text-slate-900">{receiptToPrint.date} • {receiptToPrint.time}</p>
                </div>
                <div>
                  <p className="text-slate-500">Student Name:</p>
                  <p className="font-bold text-slate-900 text-sm">{currentChild.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Class & Roll:</p>
                  <p className="font-bold text-slate-900">{currentChild.className} (Roll #{currentChild.rollNumber})</p>
                </div>
                <div>
                  <p className="text-slate-500">Parent / Guardian:</p>
                  <p className="font-bold text-slate-900">{currentUser?.name || 'Rajesh Verma'}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Payment Status:</p>
                  <p className="font-bold text-emerald-700">{receiptToPrint.paymentMethod} (PAID)</p>
                </div>
              </div>

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
                        {formatCurrency(receiptToPrint.paid)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-900 font-bold">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-right uppercase">Total Amount Received:</td>
                      <td className="p-2.5 text-right text-sm text-slate-900">
                        {formatCurrency(receiptToPrint.paid)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-6 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p>Receiver: <strong>{receiptToPrint.collectedBy}</strong></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Computer generated fee receipt.</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-900 mb-1" />
                  <p className="font-bold text-slate-900">Authorized Signatory</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReceiptToPrint(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentFeesPage;
