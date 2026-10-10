import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  Search,
  Send,
  Info,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { http, withQuery } from '@/api/http';
import { AsyncState, EmptyMessage } from '@/components/common/AsyncState';
import { formatCurrency, formatDate, formatDateTime, todayIso } from '@/utils';
import { OnlinePayButton } from '@/components/fees/OnlinePayButton';
import { OnlinePaymentReceipt } from '@/components/fees/OnlinePaymentReceipt';
import { useI18n } from '@/i18n/translate';

const DUE_BADGES = {
  Paid: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Partial: 'bg-amber-50 border-amber-200 text-amber-700',
  Overdue: 'bg-rose-50 border-rose-200 text-rose-700',
  Pending: 'bg-orange-50 border-orange-200 text-[#EA580C]',
};
const DUE_DOTS = { Paid: 'bg-emerald-500', Partial: 'bg-amber-500', Overdue: 'bg-rose-500', Pending: 'bg-[#FF6B2C]' };

const DEPOSIT_STATUS = {
  PENDING: { label: 'Verifying', className: 'bg-amber-50 border-amber-200 text-amber-700' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-50 border-rose-200 text-rose-700' },
};

const Badge = ({ className, dot, children }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${className}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
    {children}
  </span>
);

export const StudentFeesPage = () => {
  const { tx } = useI18n();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();

  const studentId = currentUser?.studentId || currentUser?.id;

  const summary = useApi(studentId ? `/fees/students/${studentId}/summary` : null);
  const payments = useApi(studentId ? withQuery('/fees/payments', { studentId }) : null);
  const deposits = useApi(studentId ? withQuery('/fees/deposits', { studentId }) : null);
  const meta = useApi('/meta');
  const onlineStatus = useApi('/online-payments/status');
  const onlineEnabled = onlineStatus.data?.enabled === true;
  const [paidOnline, setPaidOnline] = useState(null);

  const handlePaidOnline = (payment) => {
    setPaidOnline(payment);
    summary.reload();
    payments.reload();
    deposits.reload();
  };

  const [dueFilter, setDueFilter] = useState(searchParams.get('filter')?.toLowerCase() === 'pending' ? 'UNPAID' : 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [receipt, setReceipt] = useState(null);
  const [depositDue, setDepositDue] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Amount of each due already reported in deposits that the office has not yet verified.
  const verifyingByDue = useMemo(() => {
    const map = {};
    (deposits.data || [])
      .filter((d) => d.status === 'PENDING')
      .forEach((d) => {
        map[d.feeDueId] = (map[d.feeDueId] || 0) + d.amount;
      });
    return map;
  }, [deposits.data]);

  const payableFor = (due) => Math.max(0, due.pending - (verifyingByDue[due.id] || 0));

  const dues = summary.data?.dues || [];
  const filteredDues = dues.filter((d) =>
    dueFilter === 'ALL' ? true : dueFilter === 'UNPAID' ? d.pending > 0 : d.status === dueFilter,
  );
  const nextDue = [...dues].filter((d) => d.pending > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  const paymentModes = useMemo(
    () => [...new Set((payments.data || []).map((p) => p.paymentMode).filter(Boolean))],
    [payments.data],
  );
  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (payments.data || []).filter((p) => {
      if (modeFilter !== 'ALL' && p.paymentMode !== modeFilter) return false;
      if (!q) return true;
      return [p.receiptNo, p.feeTitle, p.remarks].some((v) => v && v.toLowerCase().includes(q));
    });
  }, [payments.data, searchQuery, modeFilter]);

  return (
    <div className="space-y-6 sm:space-y-8">
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
            {tx('Fee Details')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Dues, receipts and deposits for {currentUser?.name}
            {currentUser?.className ? ` (Class ${currentUser.className})` : ''}.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-2xl transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          Print Ledger
        </button>
      </div>

      <OnlinePaymentReceipt payment={paidOnline} onClose={() => setPaidOnline(null)} />

      <AsyncState state={summary} loadingText="Loading your fee summary…">
        {(s) => (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fees</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{formatCurrency(s.total)}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {s.concession > 0 ? `After ${formatCurrency(s.concession)} concession` : 'Total billed charges'}
                  </p>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid Amount</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{formatCurrency(s.paid)}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {s.total > 0 ? `${Math.round((s.paid / s.total) * 100)}% of total fee cleared` : 'Nothing billed yet'}
                  </p>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Fee Pending</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{formatCurrency(s.pending)}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {s.overdue > 0
                      ? `${formatCurrency(s.overdue)} overdue`
                      : nextDue
                        ? `Next due date: ${formatDate(nextDue.dueDate)}`
                        : 'No pending dues'}
                  </p>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Dues */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Fee Dues</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Paid UPI / bank transfer / cheque / DD? Use “Deposit fee” to report it to the office.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    ['ALL', 'All'],
                    ['UNPAID', 'Unpaid'],
                    ['Overdue', 'Overdue'],
                    ['Partial', 'Partial'],
                    ['Paid', 'Paid'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setDueFilter(key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        dueFilter === key ? 'bg-[#FF6B2C] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Fee</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Concession</th>
                      <th className="py-3.5 px-4">Paid</th>
                      <th className="py-3.5 px-4">Pending</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredDues.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          {dues.length === 0 ? 'No fees have been billed yet.' : 'No dues match this filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredDues.map((due) => {
                        const verifying = verifyingByDue[due.id] || 0;
                        const payable = payableFor(due);
                        return (
                          <tr key={due.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800">{due.title}</td>
                            <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{formatDate(due.dueDate)}</td>
                            <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">{formatCurrency(due.amount)}</td>
                            <td className="py-4 px-4 text-emerald-600 whitespace-nowrap">
                              {due.concession > 0 ? `− ${formatCurrency(due.concession)}` : '—'}
                            </td>
                            <td className="py-4 px-4 text-slate-700 whitespace-nowrap">{formatCurrency(due.paid)}</td>
                            <td className="py-4 px-4 font-bold text-rose-600 whitespace-nowrap">
                              {formatCurrency(due.pending)}
                              {verifying > 0 && (
                                <div className="text-[10px] font-semibold text-amber-600">
                                  {formatCurrency(verifying)} being verified
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <Badge className={DUE_BADGES[due.status] || DUE_BADGES.Pending} dot={DUE_DOTS[due.status]}>
                                {due.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                              {payable > 0 ? (
                                <div className="flex items-center justify-end gap-2">
                                  {onlineEnabled && deposits.data && (
                                    <OnlinePayButton due={due} amount={payable} onPaid={handlePaidOnline} />
                                  )}
                                  <button
                                    onClick={() => setDepositDue(due)}
                                    disabled={!deposits.data}
                                    className="px-3 py-1.5 rounded-xl bg-[#FFF5F0] hover:bg-orange-100 text-[#FF6B2C] text-xs font-bold transition-colors cursor-pointer border border-orange-200/60 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Deposit fee
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  {due.pending > 0 ? 'Awaiting verification' : '—'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </AsyncState>

      {/* Deposits */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">My Deposits</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Payments you reported. They count towards your fees once the office approves them.
          </p>
        </div>
        <AsyncState state={deposits} loadingText="Loading deposits…">
          {(list) =>
            list.length === 0 ? (
              <EmptyMessage text="You have not reported any deposits." />
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
                    {list.map((d) => {
                      const st = DEPOSIT_STATUS[d.status] || DEPOSIT_STATUS.PENDING;
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">
                            {formatDate(d.paidOn)}
                            <div className="text-[10px] font-medium text-slate-400">
                              Submitted {formatDateTime(d.submittedAt)}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-700">{d.feeTitle}</td>
                          <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">{formatCurrency(d.amount)}</td>
                          <td className="py-4 px-4 text-slate-600">
                            {d.paymentMode}
                            <div className="font-mono text-[11px] text-slate-500">{d.referenceNo}</div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <Badge className={st.className}>{st.label}</Badge>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-slate-600 text-xs max-w-[240px]">
                            {d.reviewNote || (d.status === 'PENDING' ? 'Waiting for the office' : '—')}
                            {d.reviewedAt && (
                              <div className="text-[10px] text-slate-400">
                                {d.reviewedBy ? `${d.reviewedBy}, ` : ''}
                                {formatDateTime(d.reviewedAt)}
                              </div>
                            )}
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

      {/* Payment receipts */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Payment History & Receipts</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredPayments.length} payment{filteredPayments.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by receipt no or fee..."
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all"
              />
            </div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full sm:w-auto h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 px-4 focus:outline-none focus:border-[#FF6B2C]"
            >
              <option value="ALL">All Payment Modes</option>
              {paymentModes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AsyncState state={payments} loadingText="Loading payments…">
          {() => (
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
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        {(payments.data || []).length === 0 ? 'No payments recorded yet.' : 'No payments match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                        onClick={() => setReceipt(p)}
                      >
                        <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">
                          {formatDate(p.paidAt)}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-[#FF6B2C]">{p.receiptNo}</td>
                        <td className="py-4 px-4 font-semibold text-slate-800">{p.feeTitle}</td>
                        <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">{formatCurrency(p.amount)}</td>
                        <td className="py-4 px-4 font-medium text-slate-600">{p.paymentMode}</td>
                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceipt(p);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#FFF5F0] hover:bg-orange-100 text-[#FF6B2C] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 border border-orange-200/60"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </AsyncState>
      </div>

      {depositDue && (
        <DepositModal
          due={depositDue}
          maxAmount={payableFor(depositDue)}
          meta={meta.data}
          onClose={() => setDepositDue(null)}
          onSaved={() => {
            setDepositDue(null);
            deposits.reload();
            summary.reload();
            triggerToast('Deposit submitted. The office will verify it.');
          }}
        />
      )}

      {receipt && (
        <ReceiptModal
          payment={receipt}
          student={currentUser}
          onClose={() => setReceipt(null)}
          onPrint={() => {
            window.print();
            triggerToast('Printing receipt...');
          }}
        />
      )}
    </div>
  );
};

const inputClass =
  'w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 px-4 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all';

const DepositModal = ({ due, maxAmount, meta, onClose, onSaved }) => {
  const { tx } = useI18n();
  const modes = meta?.depositModes || [];
  const [form, setForm] = useState({
    amount: String(maxAmount),
    paymentMode: modes[0] || '',
    referenceNo: '',
    paidOn: todayIso(),
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const amount = Number(form.amount);

  const validation = !Number.isInteger(amount) || amount <= 0
    ? 'Enter a whole rupee amount greater than zero.'
    : amount > maxAmount
      ? `You can deposit at most ${formatCurrency(maxAmount)} for this fee.`
      : !form.paymentMode
        ? 'Choose a payment mode.'
        : !form.referenceNo.trim()
          ? 'Enter the transaction / cheque reference number.'
          : !form.paidOn
            ? 'Enter the date you paid.'
            : form.paidOn > todayIso()
              ? 'The payment date cannot be in the future.'
              : '';

  const submit = async (e) => {
    e.preventDefault();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await http.post('/fees/deposits', {
        feeDueId: due.id,
        amount,
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo.trim(),
        paidOn: form.paidOn,
        note: form.note.trim(),
      });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Deposit Fee</h3>
              <p className="text-xs text-slate-500">
                {due.title} • Pending {formatCurrency(due.pending)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {meta?.depositInstructions && (
          <div className="flex gap-2.5 p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{meta.depositInstructions}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="space-y-1.5">
            <span className="font-bold text-slate-600">Amount (₹)</span>
            <input type="number" min={1} max={maxAmount} step={1} value={form.amount} onChange={set('amount')} className={inputClass} />
            <span className="text-[10px] text-slate-400">Up to {formatCurrency(maxAmount)}</span>
          </label>
          <label className="space-y-1.5">
            <span className="font-bold text-slate-600">Payment Mode</span>
            <select value={form.paymentMode} onChange={set('paymentMode')} className={inputClass}>
              {modes.length === 0 && <option value="">Loading…</option>}
              {modes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="font-bold text-slate-600">Reference / Transaction No.</span>
            <input type="text" value={form.referenceNo} onChange={set('referenceNo')} className={inputClass} placeholder="e.g. UPI ref, cheque no." />
          </label>
          <label className="space-y-1.5">
            <span className="font-bold text-slate-600">Paid On</span>
            <input type="date" max={todayIso()} value={form.paidOn} onChange={set('paidOn')} className={inputClass} />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="font-bold text-slate-600">Note (optional)</span>
            <textarea
              rows={2}
              value={form.note}
              onChange={set('note')}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 p-3 focus:outline-none focus:border-[#FF6B2C] focus:bg-white transition-all"
            />
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {tx('Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? tx('Submitting…') : tx('Submit for verification')}
          </button>
        </div>
      </form>
    </div>
  );
};

const ReceiptModal = ({ payment, student, onClose, onPrint }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Receipt Preview</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="border-2 border-slate-900 p-6 rounded-2xl bg-white space-y-5">
        <div className="text-center pb-4 border-b-2 border-slate-900">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">SHIV SHANTI ADARSH ACADEMY</h2>
          <div className="inline-block bg-slate-900 text-white font-bold text-xs px-4 py-1 rounded-full uppercase mt-2 tracking-wider">
            OFFICIAL FEE RECEIPT
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-500">Receipt No:</p>
            <p className="font-mono font-bold text-slate-900 text-sm">{payment.receiptNo}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">Date & Time:</p>
            <p className="font-bold text-slate-900">{formatDateTime(payment.paidAt)}</p>
          </div>
          <div>
            <p className="text-slate-500">Student Name:</p>
            <p className="font-bold text-slate-900 text-sm">{payment.studentName}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">Student ID / Roll:</p>
            <p className="font-bold text-slate-900">
              {payment.studentId}
              {student?.rollNumber != null ? ` (Roll #${student.rollNumber})` : ''}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Class & Section:</p>
            <p className="font-bold text-slate-900">{payment.className}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">Payment Mode:</p>
            <p className="font-bold text-emerald-700">{payment.paymentMode} (PAID)</p>
          </div>
        </div>

        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
              <tr>
                <th className="p-2.5">S.No</th>
                <th className="p-2.5">Particulars</th>
                <th className="p-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 font-bold">1</td>
                <td className="p-2.5">
                  <div className="font-bold text-slate-900">{payment.feeTitle}</div>
                  {payment.remarks && <div className="text-[11px] text-slate-500">{payment.remarks}</div>}
                </td>
                <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(payment.amount)}</td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-900 font-bold">
              <tr>
                <td colSpan={2} className="p-2.5 text-right uppercase">Total Amount Received:</td>
                <td className="p-2.5 text-right text-sm text-slate-900">{formatCurrency(payment.amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="pt-6 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p>
              Receiver: <strong>{payment.collectedBy || '—'}</strong>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Computer generated receipt.</p>
          </div>
          <div className="text-center">
            <div className="w-32 border-b border-slate-900 mb-1" />
            <p className="font-bold text-slate-900">Authorized Signatory</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
        >
          Close
        </button>
        <button
          onClick={onPrint}
          className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Official Receipt
        </button>
      </div>
    </div>
  </div>
);

export default StudentFeesPage;
