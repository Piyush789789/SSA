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
  Send,
  Clock,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { http, withQuery } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatCurrency, formatDate, formatDateTime, todayIso } from '@/utils';

const STATUS_FILTERS = ['ALL', 'Pending', 'Overdue', 'Partial', 'Paid'];

const DEPOSIT_STATUS = {
  PENDING: { label: 'Verifying', className: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-50 border-rose-200 text-rose-700', dot: 'bg-rose-500' },
};

const DUE_STATUS = {
  Paid: { className: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
  Partial: { className: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
  Overdue: { className: 'bg-rose-50 border-rose-200 text-rose-700', dot: 'bg-rose-500' },
  Pending: { className: 'bg-orange-50 border-orange-200 text-orange-700', dot: 'bg-orange-500' },
};

const StatusBadge = ({ label, style }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase ${
      style?.className || 'bg-slate-50 border-slate-200 text-slate-600'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${style?.dot || 'bg-slate-400'}`} />
    {label}
  </span>
);

/** "Pending" means anything still owed, including partially paid and overdue dues. */
const matchesStatus = (due, filter) => {
  if (filter === 'ALL') return true;
  if (filter === 'Pending') return due.pending > 0;
  return due.status === filter;
};

const inputClass =
  'w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 px-4 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all';

export const ParentFeesPage = () => {
  const { currentUser, selectedChild, switchChild } = useAuth();
  const [searchParams] = useSearchParams();
  const linkedChildren = currentUser?.linkedChildren || [];
  const childId = selectedChild?.studentId ?? null;

  const summary = useApi(childId ? `/fees/students/${encodeURIComponent(childId)}/summary` : null);
  const payments = useApi(childId ? withQuery('/fees/payments', { studentId: childId }) : null);
  const deposits = useApi(childId ? withQuery('/fees/deposits', { studentId: childId }) : null);
  const meta = useApi('/meta');

  const urlFilter = searchParams.get('filter');
  const [statusFilter, setStatusFilter] = useState(urlFilter?.toLowerCase() === 'pending' ? 'Pending' : 'ALL');
  const [feeTypeFilter, setFeeTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDue, setSelectedDue] = useState(null);
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [depositForm, setDepositForm] = useState(null); // form state while the deposit modal is open
  const [depositError, setDepositError] = useState('');
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState('');

  const dues = useMemo(() => summary.data?.dues || [], [summary.data]);

  // Money already reported for a due but not yet verified by the office.
  const awaitingByDue = useMemo(() => {
    const map = {};
    (deposits.data || [])
      .filter((d) => d.status === 'PENDING')
      .forEach((d) => {
        map[d.feeDueId] = (map[d.feeDueId] || 0) + d.amount;
      });
    return map;
  }, [deposits.data]);

  const depositableDues = useMemo(
    () => dues.filter((d) => d.pending - (awaitingByDue[d.id] || 0) > 0),
    [dues, awaitingByDue],
  );

  const feeTypes = useMemo(() => [...new Set(dues.map((d) => d.title))].sort(), [dues]);

  const filteredDues = useMemo(
    () =>
      dues.filter((due) => {
        if (!matchesStatus(due, statusFilter)) return false;
        if (feeTypeFilter !== 'ALL' && due.title !== feeTypeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          if (!due.title.toLowerCase().includes(q) && !String(due.id).toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [dues, statusFilter, feeTypeFilter, searchQuery],
  );

  const filteredPayments = useMemo(() => {
    const list = payments.data || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (p) => p.receiptNo?.toLowerCase().includes(q) || p.feeTitle?.toLowerCase().includes(q),
    );
  }, [payments.data, searchQuery]);

  const maxDepositFor = (dueId) => {
    const due = dues.find((d) => d.id === dueId);
    return due ? Math.max(0, due.pending - (awaitingByDue[due.id] || 0)) : 0;
  };

  const openDepositForm = (due) => {
    const target = due && maxDepositFor(due.id) > 0 ? due : depositableDues[0];
    if (!target) return;
    setDepositError('');
    setDepositSuccess('');
    setDepositForm({
      feeDueId: target.id,
      amount: String(maxDepositFor(target.id)),
      paymentMode: meta.data?.depositModes?.[0] || '',
      referenceNo: '',
      paidOn: todayIso(),
      note: '',
    });
  };

  const submitDeposit = async (e) => {
    e.preventDefault();
    const amount = Number(depositForm.amount);
    const max = maxDepositFor(depositForm.feeDueId);
    if (!depositForm.feeDueId) return setDepositError('Choose the fee you paid.');
    if (!Number.isInteger(amount) || amount <= 0) return setDepositError('Enter the amount in whole rupees.');
    if (amount > max) return setDepositError(`Amount cannot be more than ${formatCurrency(max)}.`);
    if (!depositForm.paymentMode) return setDepositError('Choose how you paid.');
    if (!depositForm.referenceNo.trim()) return setDepositError('Enter the transaction / cheque reference number.');
    if (!depositForm.paidOn) return setDepositError('Enter the date you paid.');

    setSavingDeposit(true);
    setDepositError('');
    try {
      await http.post('/fees/deposits', {
        feeDueId: depositForm.feeDueId,
        amount,
        paymentMode: depositForm.paymentMode,
        referenceNo: depositForm.referenceNo.trim(),
        paidOn: depositForm.paidOn,
        note: depositForm.note.trim(),
      });
      setDepositForm(null);
      setDepositSuccess('Deposit submitted. The school office will verify it and issue a receipt.');
      deposits.reload();
      summary.reload();
    } catch (err) {
      setDepositError(err.message);
    } finally {
      setSavingDeposit(false);
    }
  };

  if (!selectedChild) {
    return <EmptyMessage text="No child is linked to this parent account yet." />;
  }

  const fees = summary.data;
  const paidShare = fees && fees.total - fees.concession > 0 ? Math.round((fees.paid * 100) / (fees.total - fees.concession)) : null;

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
            Fee dues, payments and deposits for {selectedChild.name} (Class {selectedChild.className}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openDepositForm(null)}
            disabled={!depositableDues.length || !meta.data || !deposits.data}
            className="h-11 px-4 rounded-2xl bg-[#FF6B2C] hover:bg-[#F25A1B] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            title={depositableDues.length ? 'Report a fee you have paid' : 'Nothing left to deposit'}
          >
            <Send className="w-4 h-4" />
            Deposit fee
          </button>

          {/* Child Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-400 pl-2">Child:</span>
            <select
              value={selectedChild.studentId}
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
      </div>

      {depositSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="flex-1">{depositSuccess}</span>
          <button type="button" onClick={() => setDepositSuccess('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <AsyncState state={summary} loadingText="Loading fee summary…">
        {() => (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fees</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{formatCurrency(fees.total)}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {fees.concession > 0 ? `Less ${formatCurrency(fees.concession)} concession` : 'Billed charges'}
                </p>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Paid</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{formatCurrency(fees.paid)}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {paidShare == null ? 'Nothing billed yet' : `${paidShare}% of payable fee cleared`}
                </p>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Pending</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{formatCurrency(fees.pending)}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {fees.overdue > 0 ? `${formatCurrency(fees.overdue)} overdue` : 'Nothing overdue'}
                </p>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}
      </AsyncState>

      {/* Filter and Search Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by fee name or receipt no..."
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all"
            />
          </div>

          <select
            value={feeTypeFilter}
            onChange={(e) => setFeeTypeFilter(e.target.value)}
            className="w-full sm:w-auto h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 px-4 focus:outline-none focus:border-[#FF6B2C]"
          >
            <option value="ALL">All Fee Types</option>
            {feeTypes.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-2">Status:</span>
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st ? 'bg-[#FF6B2C] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Dues' : st === 'Pending' ? 'Pending (incl. partial)' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Dues Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Fee Dues</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredDues.length} of {dues.length} dues for {selectedChild.name}
          </p>
        </div>

        <AsyncState state={summary}>
          {() =>
            filteredDues.length === 0 ? (
              <EmptyMessage text={dues.length ? 'No dues match these filters.' : 'No fees have been billed yet.'} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Due Date</th>
                      <th className="py-3.5 px-4">Fee</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Concession</th>
                      <th className="py-3.5 px-4">Paid</th>
                      <th className="py-3.5 px-4">Pending</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredDues.map((due) => {
                      const awaiting = awaitingByDue[due.id] || 0;
                      return (
                        <tr
                          key={due.id}
                          className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                          onClick={() => setSelectedDue(due)}
                        >
                          <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">
                            {formatDate(due.dueDate)}
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800">
                            {due.title}
                            {awaiting > 0 && (
                              <span className="block text-[11px] font-medium text-amber-600">
                                {formatCurrency(awaiting)} awaiting verification
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(due.amount)}
                          </td>
                          <td className="py-4 px-4 font-medium text-indigo-600 whitespace-nowrap">
                            {due.concession > 0 ? formatCurrency(due.concession) : '—'}
                          </td>
                          <td className="py-4 px-4 font-bold text-emerald-600 whitespace-nowrap">
                            {formatCurrency(due.paid)}
                          </td>
                          <td className="py-4 px-4 font-bold text-rose-600 whitespace-nowrap">
                            {formatCurrency(due.pending)}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <StatusBadge label={due.status} style={DUE_STATUS[due.status]} />
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedDue(due)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                Details
                              </button>
                              {due.pending - awaiting > 0 && (
                                <button
                                  onClick={() => openDepositForm(due)}
                                  disabled={!meta.data}
                                  className="px-3 py-1.5 rounded-xl bg-[#FFF5F0] hover:bg-orange-100 text-[#FF6B2C] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-orange-200/60 disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Deposit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </AsyncState>
      </div>

      {/* Payment Receipts */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Payment History & Receipts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Payments recorded by the school office.</p>
        </div>
        <AsyncState state={payments} loadingText="Loading payments…">
          {() =>
            filteredPayments.length === 0 ? (
              <EmptyMessage text="No payments recorded yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Date</th>
                      <th className="py-3.5 px-4">Receipt No.</th>
                      <th className="py-3.5 px-4">Fee</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Method</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">
                          {formatDateTime(p.paidAt)}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-[#FF6B2C]">{p.receiptNo}</td>
                        <td className="py-4 px-4 font-semibold text-slate-800">{p.feeTitle}</td>
                        <td className="py-4 px-4 font-bold text-emerald-600 whitespace-nowrap">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-600">{p.paymentMode}</td>
                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setReceiptToPrint(p)}
                            className="ml-auto px-3 py-1.5 rounded-xl bg-[#FFF5F0] hover:bg-orange-100 text-[#FF6B2C] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-orange-200/60"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </AsyncState>
      </div>

      {/* Deposits */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Reported Deposits</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            UPI / bank / cheque payments you reported. They count once the school office approves them.
          </p>
        </div>
        <AsyncState state={deposits} loadingText="Loading deposits…">
          {(list) =>
            !list?.length ? (
              <EmptyMessage text="No deposits reported yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Paid On</th>
                      <th className="py-3.5 px-4">Fee</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Mode / Reference</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6">Office Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {list.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition-colors align-top">
                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">
                          {formatDate(d.paidOn)}
                          <span className="block text-[11px] font-medium text-slate-400">
                            Reported {formatDateTime(d.submittedAt)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {d.feeTitle}
                          {d.note && <span className="block text-[11px] font-medium text-slate-400">{d.note}</span>}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">{formatCurrency(d.amount)}</td>
                        <td className="py-4 px-4 text-slate-600">
                          {d.paymentMode}
                          <span className="block font-mono text-[11px] text-slate-500">{d.referenceNo}</span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <StatusBadge label={DEPOSIT_STATUS[d.status]?.label || d.status} style={DEPOSIT_STATUS[d.status]} />
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-600 text-xs">
                          {d.reviewNote || (d.status === 'PENDING' ? 'Awaiting verification' : '—')}
                          {d.reviewedAt && (
                            <span className="block text-[11px] text-slate-400">
                              {d.reviewedBy ? `${d.reviewedBy}, ` : ''}
                              {formatDateTime(d.reviewedAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </AsyncState>
      </div>

      {/* Due Details Modal */}
      {selectedDue && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{selectedDue.title}</h3>
                  <p className="text-xs font-mono font-bold text-[#FF6B2C]">{selectedDue.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDue(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{selectedDue.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class & Roll:</span>
                <span className="font-bold text-slate-800">
                  Class {selectedDue.className} (Roll #{selectedChild.rollNumber})
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              {[
                ['Due Date', formatDate(selectedDue.dueDate), 'text-slate-800'],
                ['Total Charge', formatCurrency(selectedDue.amount), 'text-slate-800'],
                ['Concession', formatCurrency(selectedDue.concession), 'text-indigo-600'],
                ['Amount Paid', formatCurrency(selectedDue.paid), 'text-emerald-600'],
                ['Pending Amount', formatCurrency(selectedDue.pending), 'text-rose-600'],
                ['Awaiting Verification', formatCurrency(awaitingByDue[selectedDue.id] || 0), 'text-amber-600'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">{label}:</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Payment Status:</span>
                <StatusBadge label={selectedDue.status} style={DUE_STATUS[selectedDue.status]} />
              </div>
            </div>

            {(payments.data || []).some((p) => p.feeDueId === selectedDue.id) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payments</h4>
                {(payments.data || [])
                  .filter((p) => p.feeDueId === selectedDue.id)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 text-xs"
                    >
                      <div>
                        <p className="font-mono font-bold text-[#FF6B2C]">{p.receiptNo}</p>
                        <p className="text-slate-500">
                          {formatDateTime(p.paidAt)} • {p.paymentMode}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDue(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              {maxDepositFor(selectedDue.id) > 0 && (
                <button
                  onClick={() => {
                    const due = selectedDue;
                    setSelectedDue(null);
                    openDepositForm(due);
                  }}
                  disabled={!meta.data}
                  className="px-5 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Deposit fee
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deposit Form Modal */}
      {depositForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={submitDeposit}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Deposit Fee</h3>
                  <p className="text-xs text-slate-500">
                    {selectedChild.name} (Class {selectedChild.className})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDepositForm(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {meta.data?.depositInstructions && (
              <div className="flex gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{meta.data.depositInstructions}</p>
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-600">Fee</span>
              <select
                value={depositForm.feeDueId}
                onChange={(e) =>
                  setDepositForm((f) => ({ ...f, feeDueId: e.target.value, amount: String(maxDepositFor(e.target.value)) }))
                }
                className={inputClass}
              >
                {depositableDues.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} — up to {formatCurrency(maxDepositFor(d.id))}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">
                  Amount (max {formatCurrency(maxDepositFor(depositForm.feeDueId))})
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={maxDepositFor(depositForm.feeDueId)}
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm((f) => ({ ...f, amount: e.target.value }))}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">Payment Mode</span>
                <select
                  value={depositForm.paymentMode}
                  onChange={(e) => setDepositForm((f) => ({ ...f, paymentMode: e.target.value }))}
                  className={inputClass}
                  required
                >
                  {(meta.data?.depositModes || []).map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">Reference / Transaction No.</span>
                <input
                  type="text"
                  value={depositForm.referenceNo}
                  onChange={(e) => setDepositForm((f) => ({ ...f, referenceNo: e.target.value }))}
                  placeholder="UTR, cheque or DD number"
                  className={inputClass}
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">Paid On</span>
                <input
                  type="date"
                  value={depositForm.paidOn}
                  max={todayIso()}
                  onChange={(e) => setDepositForm((f) => ({ ...f, paidOn: e.target.value }))}
                  className={inputClass}
                  required
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-600">Note (optional)</span>
              <textarea
                rows={2}
                value={depositForm.note}
                onChange={(e) => setDepositForm((f) => ({ ...f, note: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 p-3 focus:outline-none focus:border-[#FF6B2C] focus:bg-white"
              />
            </label>

            {depositError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {depositError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDepositForm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingDeposit}
                className="px-5 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                {savingDeposit ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {savingDeposit ? 'Submitting…' : 'Submit for verification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official Receipt Modal */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Receipt Preview</span>
              <button onClick={() => setReceiptToPrint(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-slate-900 p-6 rounded-2xl bg-white space-y-5">
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  SHIV SHANTI ADARSH ACADEMY
                </h2>
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
                  <p className="font-bold text-slate-900">{formatDateTime(receiptToPrint.paidAt)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Student Name:</p>
                  <p className="font-bold text-slate-900 text-sm">{receiptToPrint.studentName}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Class & Roll:</p>
                  <p className="font-bold text-slate-900">
                    {receiptToPrint.className} (Roll #{selectedChild.rollNumber})
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Parent / Guardian:</p>
                  <p className="font-bold text-slate-900">{currentUser?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Payment Mode:</p>
                  <p className="font-bold text-emerald-700">{receiptToPrint.paymentMode}</p>
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
                        <div className="font-bold text-slate-900">{receiptToPrint.feeTitle}</div>
                        {receiptToPrint.remarks && (
                          <div className="text-[11px] text-slate-500">{receiptToPrint.remarks}</div>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(receiptToPrint.amount)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-900 font-bold">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-right uppercase">
                        Total Amount Received:
                      </td>
                      <td className="p-2.5 text-right text-sm text-slate-900">{formatCurrency(receiptToPrint.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-6 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p>
                    Receiver: <strong>{receiptToPrint.collectedBy || '—'}</strong>
                  </p>
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
